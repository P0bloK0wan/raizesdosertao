import { exigirSessao } from "./auth.js";
import { db } from "./firebase.js";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
exigirSessao("lideranca",()=>{
 const form=document.getElementById("form-evento-publico"),lista=document.getElementById("eventos-publicos-gestao"),status=document.getElementById("evento-publico-status");
 if(form.dataset.iniciado)return;form.dataset.iniciado="1";
 form.addEventListener("submit",async e=>{
   e.preventDefault();const btn=form.querySelector('[type="submit"]');btn.disabled=true;status.textContent="Publicando…";
   const titulo=document.getElementById("evento-publico-titulo").value.trim(),data=document.getElementById("evento-publico-data").value,localPublico=document.getElementById("evento-publico-local").value.trim(),descricao=document.getElementById("evento-publico-descricao").value.trim();
   try{if(!titulo||!data)throw new Error("Informe título e data.");await addDoc(collection(db,"eventosPublicos"),{titulo,data,localPublico,descricao,publicado:true});form.reset();status.textContent="Evento publicado na agenda pública."}catch(err){status.textContent="Não foi possível publicar: "+err.message}finally{btn.disabled=false}
 });
 onSnapshot(query(collection(db,"eventosPublicos"),orderBy("data","asc")),snap=>{
   lista.replaceChildren();const heading=document.createElement("h4");heading.textContent="Eventos publicados";lista.append(heading);
   if(snap.empty){const p=document.createElement("p");p.textContent="Nenhum evento publicado.";lista.append(p)}
   snap.docs.forEach(d=>{const ev=d.data(),line=document.createElement("div");line.className="public-card";line.style.marginBottom=".75rem";const txt=document.createElement("span");txt.textContent=(ev.data||"")+" — "+(ev.titulo||"");const del=document.createElement("button");del.type="button";del.className="btn btn-outline btn-sm";del.style.marginLeft="1rem";del.textContent="Retirar da agenda";del.addEventListener("click",async()=>{if(!confirm("Retirar este evento da agenda pública?"))return;del.disabled=true;try{await deleteDoc(doc(db,"eventosPublicos",d.id))}catch(err){status.textContent="Falha ao retirar: "+err.message;del.disabled=false}});line.append(txt,del);lista.append(line)})
 },()=>{status.textContent="Não foi possível carregar os eventos publicados."});
});