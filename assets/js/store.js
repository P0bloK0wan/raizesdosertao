/* =========================================================
   Camada de dados — Firestore (sincronizado entre todos os
   aparelhos, em tempo real). Sem servidor próprio: o Firebase
   cuida de tudo, no plano gratuito.
   ========================================================= */

import { db } from "./firebase.js";
import { RS_UNIDADES, RS_CAMPORI_DATA_PADRAO, RS_LAVAJATO_VAGAS_POR_DOMINGO, extrairIdPastaDrive } from "./data.js";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, orderBy, query, runTransaction,
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

/* ---------- registros de requisitos por desbravador ----------
   Cada desbravador acumula um histórico de lançamentos avulsos
   (ex.: "Bíblia / Lição" em 12/08/2026). Não é uma lista única
   por unidade — é por aluno, quantos registros a unidade quiser. */
export function watchRegistrosMembro(unidadeId, membroId, cb) {
  return onSnapshot(
    query(collection(db, "unidades", unidadeId, "membros", membroId, "registros"), orderBy("data", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export function addRegistro(unidadeId, membroId, { criterio, data }) {
  return addDoc(collection(db, "unidades", unidadeId, "membros", membroId, "registros"), {
    criterio, data, criadoEm: serverTimestamp(),
  });
}
export function deleteRegistro(unidadeId, membroId, registroId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "membros", membroId, "registros", registroId));
}

/* ---------- Lava Jato: agenda de domingos + cadastros ----------
   "lavajato_domingos" guarda só o resumo de cada domingo (vagas
   ocupadas, se está fechado) — é pública pra leitura, pra qualquer
   visitante ver a agenda sem expor dado pessoal de ninguém. Os
   dados de cada cliente (nome, telefone, placa...) ficam em
   "lavajato", que só a liderança pode ler. */
export function watchDomingos(cb) {
  return onSnapshot(collection(db, "lavajato_domingos"), (snap) => {
    const porData = {};
    snap.docs.forEach((d) => { porData[d.id] = d.data(); });
    cb(porData);
  });
}
export function fecharDomingo(data, motivo) {
  return setDoc(doc(db, "lavajato_domingos", data), {
    fechado: true,
    motivo: motivo || "",
    vagasTotal: RS_LAVAJATO_VAGAS_POR_DOMINGO,
    vagasOcupadas: 0,
  }, { merge: true });
}
export function abrirDomingo(data) {
  return setDoc(doc(db, "lavajato_domingos", data), {
    fechado: false,
    motivo: "",
    vagasTotal: RS_LAVAJATO_VAGAS_POR_DOMINGO,
    vagasOcupadas: 0,
  }, { merge: true });
}

/* Cria o cadastro do cliente e ocupa uma vaga naquele domingo, os
   dois numa transação — evita passar de 5 carros no mesmo dia
   mesmo com gente cadastrando ao mesmo tempo. */
export async function criarRegistroLavaJato(dados) {
  const domingoRef = doc(db, "lavajato_domingos", dados.data);
  const novoRegistroRef = doc(collection(db, "lavajato"));

  await runTransaction(db, async (tx) => {
    const domingoSnap = await tx.get(domingoRef);
    const atual = domingoSnap.exists()
      ? domingoSnap.data()
      : { fechado: false, vagasTotal: RS_LAVAJATO_VAGAS_POR_DOMINGO, vagasOcupadas: 0 };

    if (atual.fechado) throw new Error("Esse domingo está fechado pro Lava Jato.");
    if (atual.vagasOcupadas >= atual.vagasTotal) throw new Error("Esse domingo já está lotado.");

    tx.set(domingoRef, {
      fechado: atual.fechado,
      vagasTotal: atual.vagasTotal,
      vagasOcupadas: atual.vagasOcupadas + 1,
    });
    tx.set(novoRegistroRef, {
      ...dados,
      criadoEm: serverTimestamp(),
      cancelado: false,
      canceladoEm: null,
    });
  });

  return novoRegistroRef;
}

/* Cancelamento feito pelo próprio cliente (sem login) — o
   navegador guarda o id do cadastro e a data do domingo. */
export async function cancelarRegistroLavaJato(registroId, data) {
  const domingoRef = doc(db, "lavajato_domingos", data);
  await runTransaction(db, async (tx) => {
    const domingoSnap = await tx.get(domingoRef);
    if (domingoSnap.exists()) {
      const atual = domingoSnap.data();
      tx.set(domingoRef, {
        fechado: atual.fechado,
        vagasTotal: atual.vagasTotal,
        vagasOcupadas: Math.max(0, (atual.vagasOcupadas || 0) - 1),
      });
    }
    tx.update(doc(db, "lavajato", registroId), {
      cancelado: true,
      canceladoEm: serverTimestamp(),
    });
  });
}

/* Exclusão feita pela liderança — libera a vaga de volta só se o
   cadastro ainda não estava cancelado (senão a vaga já tinha sido
   liberada no cancelamento). */
export async function deleteRegistroLavaJato(registroId, data) {
  const registroRef = doc(db, "lavajato", registroId);
  const domingoRef = doc(db, "lavajato_domingos", data);
  await runTransaction(db, async (tx) => {
    const registroSnap = await tx.get(registroRef);
    const jaCancelado = registroSnap.exists() && registroSnap.data().cancelado;
    if (!jaCancelado) {
      const domingoSnap = await tx.get(domingoRef);
      if (domingoSnap.exists()) {
        const atual = domingoSnap.data();
        tx.set(domingoRef, {
          fechado: atual.fechado,
          vagasTotal: atual.vagasTotal,
          vagasOcupadas: Math.max(0, (atual.vagasOcupadas || 0) - 1),
        });
      }
    }
    tx.delete(registroRef);
  });
}
/* Só a liderança tem permissão de leitura desta coleção (ver
   firestore.rules) — por isso este watch é usado só no painel. */
export function watchLavaJato(cb) {
  return onSnapshot(query(collection(db, "lavajato"), orderBy("criadoEm", "desc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ---------- Mídia: pastas do Google Drive (pública) ----------
   As fotos de dentro da pasta são buscadas direto no navegador do
   visitante via Drive API (ver assets/js/midia-drive.js). */
export function watchMidia(cb) {
  return onSnapshot(query(collection(db, "midia"), orderBy("criadoEm", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export function addPastaMidia(nome, link) {
  return addDoc(collection(db, "midia"), {
    nome,
    link,
    folderId: extrairIdPastaDrive(link),
    criadoEm: serverTimestamp(),
  });
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
  for (const u of RS_UNIDADES) {
    const mSnap = await getDocs(collection(db, "unidades", u.id, "membros"));
    const lista = [];
    for (const m of mSnap.docs) {
      const rSnap = await getDocs(collection(db, "unidades", u.id, "membros", m.id, "registros"));
      lista.push({
        id: m.id,
        ...m.data(),
        registros: rSnap.docs.map((r) => ({ id: r.id, ...r.data() })),
      });
    }
    membros[u.id] = lista;
  }
  const lavajatoSnap = await getDocs(collection(db, "lavajato"));
  const domingosSnap = await getDocs(collection(db, "lavajato_domingos"));
  const midiaSnap = await getDocs(collection(db, "midia"));
  const camporiDoc = await getDoc(doc(db, "config", "campori"));

  const payload = {
    tipo: "rs-backup-completo",
    exportadoEm: new Date().toISOString(),
    membros,
    lavajato: lavajatoSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lavajatoDomingos: domingosSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
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
