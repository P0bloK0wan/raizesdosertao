"use strict";
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("node:crypto");
admin.initializeApp();
const db = admin.firestore();
const TOKEN = defineSecret("MERCADO_PAGO_ACCESS_TOKEN");
const ORIGIN = "https://cluberaizesdosertao.site";
const ALLOWED = new Set([ORIGIN,"https://www.cluberaizesdosertao.site"]);
const PRICE = 50;
function cors(req,res) {
  const origin = req.get("origin");
  if (origin && ALLOWED.has(origin)) res.set("Access-Control-Allow-Origin",origin);
  res.set("Vary","Origin");
  res.set("Access-Control-Allow-Methods","POST, OPTIONS");
  res.set("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") {res.status(204).end();return false;}
  if (req.method!=="POST" || (origin && !ALLOWED.has(origin))) {res.status(403).json({erro:"Requisição não permitida."});return false;}
  return true;
}
async function mp(path,options={}) {
  const response=await fetch("https://api.mercadopago.com"+path,{
    ...options,
    headers:{"Authorization":"Bearer "+TOKEN.value(),"Content-Type":"application/json",...(options.headers||{})}
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error("Mercado Pago: "+response.status);
  return data;
}
function pixView(doc) {
  return {status:doc.status||"pending",codigo:doc.codigo||"",qrBase64:doc.qrBase64||"",ticketUrl:doc.ticketUrl||""};
}
async function validarReserva(reservaId,token) {
  if(typeof reservaId!=="string"||!/^[-\w]{10,128}$/.test(reservaId)||typeof token!=="string"||token.length<32) return null;
  const ref=db.collection("lavajato").doc(reservaId);
  const snap=await ref.get();
  if(!snap.exists||snap.get("tokenCancelamento")!==token||snap.get("cancelado")) return null;
  return {ref,data:snap.data()};
}
exports.criarPixLavaJato=onRequest({region:"us-central1",secrets:[TOKEN],cors:false,maxInstances:5},async(req,res)=>{
  if(!cors(req,res))return;
  const {reservaId,token,email}=req.body||{};
  if(typeof email!=="string"||email.length>120||!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({erro:"Informe um e-mail válido."});
  const reserva=await validarReserva(reservaId,token);
  if(!reserva)return res.status(404).json({erro:"Reserva não encontrada."});
  const ref=db.collection("lavajato_pix").doc(reservaId);
  try {
    const atual=await ref.get();
    if(atual.exists) {
      if(atual.get("status")==="creating")return res.status(409).json({erro:"Seu Pix está sendo gerado. Aguarde um instante."});
      if(["pending","approved","in_process"].includes(atual.get("status")))return res.json(pixView(atual.data()));
    }
    await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(snap.exists&&["creating","pending","approved","in_process"].includes(snap.get("status")))throw new Error("Pix já solicitado.");
      tx.set(ref,{status:"creating",reservaId,criadoEm:admin.firestore.FieldValue.serverTimestamp()});
    });
    let payment;
    try {
      payment=await mp("/v1/payments",{method:"POST",headers:{"X-Idempotency-Key":"lavajato-"+reservaId},body:JSON.stringify({
        transaction_amount:PRICE,description:"Lava Jato Raízes do Sertão",payment_method_id:"pix",
        external_reference:reservaId,payer:{email}
      })});
    } catch(err) {
      await ref.update({status:"error"});
      throw err;
    }
    const td=payment.point_of_interaction?.transaction_data||{};
    await ref.set({
      status:payment.status||"pending",paymentId:String(payment.id),reservaId,
      valor:PRICE,codigo:td.qr_code||"",qrBase64:td.qr_code_base64||"",
      ticketUrl:td.ticket_url||"",atualizadoEm:admin.firestore.FieldValue.serverTimestamp()
    },{merge:true});
    return res.json(pixView((await ref.get()).data()));
  }catch(err){console.error("Falha ao gerar Pix:",err.message);return res.status(503).json({erro:"Não foi possível gerar o Pix agora. Sua reserva continua válida."});}
});
exports.statusPixLavaJato=onRequest({region:"us-central1",secrets:[TOKEN],cors:false,maxInstances:5},async(req,res)=>{
  if(!cors(req,res))return;
  const {reservaId,token}=req.body||{};
  const reserva=await validarReserva(reservaId,token);
  if(!reserva)return res.status(404).json({erro:"Reserva não encontrada."});
  const snap=await db.collection("lavajato_pix").doc(reservaId).get();
  if(!snap.exists)return res.json({status:"not_created"});
  let data=snap.data();
  if(data.paymentId&&data.status!=="approved") {
    try {
      const p=await mp("/v1/payments/"+encodeURIComponent(data.paymentId));
      if(p.external_reference===reservaId&&p.payment_method_id==="pix"&&Number(p.transaction_amount)===PRICE) {
        const status=p.status;
        if(status!==data.status) {
          await snap.ref.update({status,atualizadoEm:admin.firestore.FieldValue.serverTimestamp()});
          if(status==="approved")await reserva.ref.update({pagamentoStatus:"approved",pagamentoValor:PRICE});
          data={...data,status};
        }
      }
    }catch(err){console.error("Consulta Pix:",err.message);}
  }
  return res.json(pixView(data));
});
exports.webhookPixLavaJato=onRequest({region:"us-central1",secrets:[TOKEN],cors:false,maxInstances:5},async(req,res)=>{
  if(req.method!=="POST")return res.status(405).end();
  // Notificações são tratadas somente como gatilho: consultar a API oficial com token secreto.
  const id=String(req.body?.data?.id||req.query["data.id"]||"");
  if(!/^\d{1,24}$/.test(id))return res.status(200).end();
  try {
    const p=await mp("/v1/payments/"+id);
    const reservaId=p.external_reference;
    if(typeof reservaId!=="string"||!/^[-\w]{10,128}$/.test(reservaId)||p.payment_method_id!=="pix"||Number(p.transaction_amount)!==PRICE)return res.status(200).end();
    const ref=db.collection("lavajato_pix").doc(reservaId);
    const snap=await ref.get();
    if(!snap.exists||snap.get("paymentId")!==id)return res.status(200).end();
    await ref.update({status:p.status,atualizadoEm:admin.firestore.FieldValue.serverTimestamp()});
    if(p.status==="approved") {
      const booking=db.collection("lavajato").doc(reservaId);
      await booking.update({pagamentoStatus:"approved",pagamentoValor:PRICE});
    }
  }catch(err){console.error("Webhook Pix:",err.message);return res.status(500).end();}
  return res.status(200).end();
});
