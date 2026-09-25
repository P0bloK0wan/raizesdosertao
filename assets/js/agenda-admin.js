import { exigirSessao } from "./auth.js";
import { db } from "./firebase.js";
import { collection,addDoc,deleteDoc,doc,onSnapshot,orderBy,query,updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
exigirSessao("lideranca",()=>{
 const form=document.getElementById("form-evento-publico"),status=document.getElementById("ev-status"),lista=document.getElementById("ev-lista");
 const col=collection(db,"eventosPublicos");
 form.addEventListener("submit",async e=>{
   e.preventDefault();
   const dados={titulo:document.getElementById("ev-titulo").value.trim(),data:document.getElementById("ev-data").value,localPublico:document.getElementById("ev-local").value.trim(),descricao:document.getElementById("ev-descricao").value.trim(),publicado:document.getElementById("ev-publicado").checked};
   if(dados.titulo.length<3||!/^\d{4}-\d{2}-\d{2}$/.test(dados.data)){status.textContent="Preencha título e data.";return}
   const btn=form.querySelector('button[type="submit"]');btn.disabled=true;status.textContent="Salvando…";
   try{await addDoc(col,dados);form.reset();status.textContent="Evento salvo."}catch(err){console.error(err);status.textContent="Não foi possível salvar. Verifique a conexão e as regras do Firestore."}finally{btn.disabled=false}
 });
 onSnapshot(query(col,orderBy("data","asc")),snap=>{
   lista.replaceChildren();
   if(snap.empty){lista.textContent="Nenhum evento cadastrado.";return}
   for(const d of snap.docs){
     const ev=d.data(),card=document.createElement("article");card.className="public-card";
     const title=document.createElement("h3");title.textContent=ev.titulo||"Sem título";
     const info=document.createElement("p");info.textContent=[ev.data,ev.localPublico,ev.publicado?"Publicado":"Rascunho"].filter(Boolean).join(" · ");
     const toggle=document.createElement("button");toggle.type="button";toggle.className="btn btn-outline";toggle.textContent=ev.publicado?"Retirar do público":"Publicar";
     toggle.addEventListener("click",async()=>{toggle.disabled=true;try{await updateDoc(doc(db,"eventosPublicos",d.id),{publicado:!ev.publicado})}catch(err){console.error(err);alert("Falha ao atualizar publicação.")}finally{toggle.disabled=false}});
     const del=document.createElement("button");del.type="button";del.className="btn btn-outline";del.textContent="Excluir";del.addEventListener("click",async()=>{if(!confirm("Excluir este evento público?"))return;del.disabled=true;try{await deleteDoc(doc(db,"eventosPublicos",d.id))}catch(err){console.error(err);alert("Não foi possível excluir.");del.disabled=false}});
     const actions=document.createElement("div");actions.className="public-actions";actions.append(toggle,del);card.append(title,info,actions);lista.append(card)
   }
 },err=>{console.error(err);lista.textContent="Falha ao carregar eventos. Verifique as regras do Firestore."});
});
