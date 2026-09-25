import { db } from "./firebase.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
const alvo=document.getElementById("eventos-publicos");
if(alvo){
 const hoje=new Date().toISOString().slice(0,10);
 const dataBr=s=>{const [a,m,d]=String(s).split("-");return a&&m&&d?d+"/"+m+"/"+a:"Data a confirmar"};
 const mensagem=t=>{const p=document.createElement("p");p.className="public-empty";p.textContent=t;alvo.replaceChildren(p)};
 mensagem("Carregando a programação pública…");
 onSnapshot(query(collection(db,"eventosPublicos"),orderBy("data","asc")),snap=>{
   const eventos=snap.docs.map(d=>d.data()).filter(e=>e.publicado===true&&typeof e.data==="string"&&e.data>=hoje).slice(0,30);
   if(!eventos.length){mensagem("Ainda não há eventos públicos divulgados. Acompanhe nossas redes para novidades.");return}
   alvo.replaceChildren(...eventos.map(e=>{
     const card=document.createElement("article");card.className="public-card";
     const date=document.createElement("p");date.className="public-event-date";date.textContent=dataBr(e.data);
     const titulo=document.createElement("h2");titulo.textContent=e.titulo||"Atividade do clube";
     const desc=document.createElement("p");desc.textContent=e.descricao||"";
     card.append(date,titulo,desc);
     if(e.localPublico){const loc=document.createElement("p");loc.textContent="📍 "+e.localPublico;card.append(loc)}
     return card;
   }));
 },()=>mensagem("Não foi possível carregar a agenda agora. Tente novamente mais tarde."));
}