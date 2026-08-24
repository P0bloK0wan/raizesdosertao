/* =========================================================
   Camada de dados — Firestore (sincronizado entre todos os
   aparelhos, em tempo real). Sem servidor próprio: o Firebase
   cuida de tudo, no plano gratuito.
   ========================================================= */

import { db } from "./firebase.js";
import { RS_UNIDADES, RS_TOPICOS_PADRAO, RS_CAMPORI_DATA_PADRAO } from "./data.js";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, orderBy, query,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------- tema (só de exibição, pode ficar local) ---------- */
export function getTheme() {
  return localStorage.getItem("rs_tema") || "light";
}
export function setTheme(theme) {
  localStorage.setItem("rs_tema", theme);
}

/* ---------- membros por unidade ---------- */
export function watchMembros(unidadeId, cb) {
  return onSnapshot(collection(db, "unidades", unidadeId, "membros"), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export function addMembro(unidadeId, membro) {
  return addDoc(collection(db, "unidades", unidadeId, "membros"), membro);
}
export function deleteMembro(unidadeId, membroId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "membros", membroId));
}

/* ---------- tópicos / atividades por unidade ---------- */
export function watchTopicos(unidadeId, cb) {
  return onSnapshot(collection(db, "unidades", unidadeId, "topicos"), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export async function garantirTopicosSeeded(unidadeId) {
  const snap = await getDocs(collection(db, "unidades", unidadeId, "topicos"));
  if (!snap.empty) return;
  await Promise.all(
    RS_TOPICOS_PADRAO.map((nome) =>
      addDoc(collection(db, "unidades", unidadeId, "topicos"), { nome, realizado: false })
    )
  );
}
export function addTopico(unidadeId, nome) {
  return addDoc(collection(db, "unidades", unidadeId, "topicos"), { nome, realizado: false });
}
export function toggleTopico(unidadeId, topicoId, realizado) {
  return updateDoc(doc(db, "unidades", unidadeId, "topicos", topicoId), { realizado });
}
export function renomearTopico(unidadeId, topicoId, nome) {
  return updateDoc(doc(db, "unidades", unidadeId, "topicos", topicoId), { nome });
}
export function deleteTopico(unidadeId, topicoId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "topicos", topicoId));
}

/* ---------- Lava Jato: cadastros de atendimento ---------- */
export function criarRegistroLavaJato(dados) {
  return addDoc(collection(db, "lavajato"), {
    ...dados,
    criadoEm: serverTimestamp(),
    cancelado: false,
    canceladoEm: null,
  });
}
export function cancelarRegistroLavaJato(registroId) {
  return updateDoc(doc(db, "lavajato", registroId), {
    cancelado: true,
    canceladoEm: serverTimestamp(),
  });
}
export function deleteRegistroLavaJato(registroId) {
  return deleteDoc(doc(db, "lavajato", registroId));
}
/* Só a liderança tem permissão de leitura desta coleção (ver
   firestore.rules) — por isso este watch é usado só no painel. */
export function watchLavaJato(cb) {
  return onSnapshot(query(collection(db, "lavajato"), orderBy("criadoEm", "desc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ---------- Mídia: pastas com link do Google Drive/Fotos (pública) ---------- */
export function watchMidia(cb) {
  return onSnapshot(query(collection(db, "midia"), orderBy("criadoEm", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export function addPastaMidia(nome, link) {
  return addDoc(collection(db, "midia"), { nome, link, criadoEm: serverTimestamp() });
}
export function deletePastaMidia(pastaId) {
  return deleteDoc(doc(db, "midia", pastaId));
}

/* ---------- Campori: data do evento (configurável pela liderança) ---------- */
export function watchCampori(cb) {
  return onSnapshot(doc(db, "config", "campori"), (d) => {
    cb(d.exists() ? d.data() : { data: RS_CAMPORI_DATA_PADRAO });
  });
}
export function setCamporiData(data) {
  return setDoc(doc(db, "config", "campori"), { data });
}

/* ---------- backup (exportar tudo em .json, só leitura) ---------- */
export async function exportarBackup() {
  const membros = {};
  const topicos = {};
  for (const u of RS_UNIDADES) {
    const mSnap = await getDocs(collection(db, "unidades", u.id, "membros"));
    membros[u.id] = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const tSnap = await getDocs(collection(db, "unidades", u.id, "topicos"));
    topicos[u.id] = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const lavajatoSnap = await getDocs(collection(db, "lavajato"));
  const midiaSnap = await getDocs(collection(db, "midia"));
  const camporiDoc = await getDoc(doc(db, "config", "campori"));

  const payload = {
    tipo: "rs-backup-completo",
    exportadoEm: new Date().toISOString(),
    membros,
    topicos,
    lavajato: lavajatoSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    midia: midiaSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    campori: camporiDoc.exists() ? camporiDoc.data() : null,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "raizes-do-sertao-backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
