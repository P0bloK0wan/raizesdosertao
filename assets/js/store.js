/* =========================================================
   Camada de dados — Firestore (sincronizado entre todos os
   aparelhos, em tempo real). Sem servidor próprio: o Firebase
   cuida de tudo, no plano gratuito.
   ========================================================= */

import { db } from "./firebase.js";
import { RS_UNIDADES, RS_META_PADRAO, rsGerarVagasPadrao } from "./data.js";
import {
  collection, doc, addDoc, setDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, writeBatch,
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
export async function getMembros(unidadeId) {
  const snap = await getDocs(collection(db, "unidades", unidadeId, "membros"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export function addMembro(unidadeId, membro) {
  return addDoc(collection(db, "unidades", unidadeId, "membros"), membro);
}
export function deleteMembro(unidadeId, membroId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "membros", membroId));
}

/* ---------- avaliações semanais por unidade ---------- */
export function watchAvaliacoes(unidadeId, cb) {
  return onSnapshot(collection(db, "unidades", unidadeId, "avaliacoes"), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export async function getAvaliacoes(unidadeId) {
  const snap = await getDocs(collection(db, "unidades", unidadeId, "avaliacoes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export function addAvaliacao(unidadeId, avaliacao) {
  return addDoc(collection(db, "unidades", unidadeId, "avaliacoes"), avaliacao);
}
export function deleteAvaliacao(unidadeId, avaliacaoId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "avaliacoes", avaliacaoId));
}

/* ---------- vagas do lava jato (coleção compartilhada) ---------- */
export function watchVagas(cb) {
  return onSnapshot(collection(db, "vagas"), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export async function garantirVagasSeeded() {
  const snap = await getDocs(collection(db, "vagas"));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  rsGerarVagasPadrao().forEach((v) => {
    const { id, ...resto } = v;
    batch.set(doc(db, "vagas", id), resto);
  });
  await batch.commit();
}
export function criarVaga(vaga) {
  return addDoc(collection(db, "vagas"), vaga);
}
export function fecharVaga(vagaId, unidadeId, responsavel, membros) {
  return setDoc(doc(db, "vagas", vagaId), { unidadeId, responsavel, membros }, { merge: true });
}
export function reabrirVaga(vagaId) {
  return setDoc(doc(db, "vagas", vagaId), { unidadeId: null, responsavel: "", membros: [] }, { merge: true });
}
export function excluirVaga(vagaId) {
  return deleteDoc(doc(db, "vagas", vagaId));
}

/* ---------- meta de arrecadação ---------- */
export function watchMeta(cb) {
  return onSnapshot(doc(db, "config", "meta"), (d) => {
    cb(d.exists() ? d.data() : { ...RS_META_PADRAO });
  });
}
export function setMeta(meta) {
  return setDoc(doc(db, "config", "meta"), meta);
}

/* ---------- galeria de fotos/vídeos (pública) ---------- */
export function watchGaleria(cb) {
  return onSnapshot(collection(db, "galeria"), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export function addAlbum(album) {
  return addDoc(collection(db, "galeria"), album);
}
export function deleteAlbum(albumId) {
  return deleteDoc(doc(db, "galeria", albumId));
}

/* ---------- backup (exportar tudo em .json, só leitura) ---------- */
export async function exportarBackup() {
  const membros = {};
  const avaliacoes = {};
  for (const u of RS_UNIDADES) {
    membros[u.id] = await getMembros(u.id);
    avaliacoes[u.id] = await getAvaliacoes(u.id);
  }
  const vagasSnap = await getDocs(collection(db, "vagas"));
  const galeriaSnap = await getDocs(collection(db, "galeria"));
  const metaDoc = await getDoc(doc(db, "config", "meta"));

  const payload = {
    tipo: "rs-backup-completo",
    exportadoEm: new Date().toISOString(),
    membros,
    avaliacoes,
    vagas: vagasSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    galeria: galeriaSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    meta: metaDoc.exists() ? metaDoc.data() : null,
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
