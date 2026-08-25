/* =========================================================
   Camada de dados — Firestore (sincronizado entre todos os
   aparelhos, em tempo real). Sem servidor próprio: o Firebase
   cuida de tudo, no plano gratuito.
   ========================================================= */

import { db, storage } from "./firebase.js";
import { RS_UNIDADES, RS_CAMPORI_DATA_PADRAO, RS_LAVAJATO_VAGAS_POR_DOMINGO } from "./data.js";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, orderBy, query, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, listAll, deleteObject,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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

/* ---------- especialidades por desbravador ---------- */
export function watchEspecialidadesMembro(unidadeId, membroId, cb) {
  return onSnapshot(
    query(collection(db, "unidades", unidadeId, "membros", membroId, "especialidades"), orderBy("criadoEm", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export function addEspecialidade(unidadeId, membroId, dados) {
  return addDoc(collection(db, "unidades", unidadeId, "membros", membroId, "especialidades"), {
    ...dados, criadoEm: serverTimestamp(),
  });
}
export function updateEspecialidade(unidadeId, membroId, espId, dados) {
  return updateDoc(doc(db, "unidades", unidadeId, "membros", membroId, "especialidades", espId), dados);
}
export function deleteEspecialidade(unidadeId, membroId, espId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "membros", membroId, "especialidades", espId));
}

/* ---------- "o que falta comprar" por desbravador ---------- */
export function watchMateriaisMembro(unidadeId, membroId, cb) {
  return onSnapshot(
    query(collection(db, "unidades", unidadeId, "membros", membroId, "materiais"), orderBy("criadoEm", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export function addMaterial(unidadeId, membroId, { nome, especialidade }) {
  return addDoc(collection(db, "unidades", unidadeId, "membros", membroId, "materiais"), {
    nome, especialidade: especialidade || "", status: "pendente", criadoEm: serverTimestamp(),
  });
}
export function toggleMaterial(unidadeId, membroId, itemId, status) {
  return updateDoc(doc(db, "unidades", unidadeId, "membros", membroId, "materiais", itemId), { status });
}
export function deleteMaterial(unidadeId, membroId, itemId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "membros", membroId, "materiais", itemId));
}

/* ---------- Planejamento das Unidades ---------- */
export function watchPlanejamentos(unidadeId, cb) {
  return onSnapshot(
    query(collection(db, "unidades", unidadeId, "planejamentos"), orderBy("data", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export function addPlanejamento(unidadeId, dados) {
  return addDoc(collection(db, "unidades", unidadeId, "planejamentos"), {
    ...dados,
    status: "pendente",
    motivoRecusa: "",
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  }).then((ref) => {
    criarNotificacaoLideranca({
      tipo: "novo_planejamento",
      mensagem: `A unidade ${unidadeId} enviou uma nova proposta de planejamento: "${dados.titulo}".`,
      unidadeId,
      planId: ref.id,
    });
    return ref;
  });
}
/* Editar sempre reenvia como "pendente" (nunca deixa a própria
   unidade se auto-aprovar — a regra do Firestore também garante
   isso do lado do servidor). */
export function editarPlanejamento(unidadeId, planId, dados) {
  return updateDoc(doc(db, "unidades", unidadeId, "planejamentos", planId), {
    ...dados,
    status: "pendente",
    motivoRecusa: "",
    atualizadoEm: serverTimestamp(),
  });
}
export function aprovarPlanejamento(unidadeId, planId, titulo) {
  return updateDoc(doc(db, "unidades", unidadeId, "planejamentos", planId), {
    status: "aprovado",
    motivoRecusa: "",
    atualizadoEm: serverTimestamp(),
  }).then(() =>
    criarNotificacaoUnidade(unidadeId, {
      tipo: "planejamento_aprovado",
      mensagem: `Seu planejamento "${titulo}" foi aprovado!`,
      motivo: "",
      planId,
    })
  );
}
export function recusarPlanejamento(unidadeId, planId, titulo, motivo) {
  return updateDoc(doc(db, "unidades", unidadeId, "planejamentos", planId), {
    status: "recusado",
    motivoRecusa: motivo,
    atualizadoEm: serverTimestamp(),
  }).then(() =>
    criarNotificacaoUnidade(unidadeId, {
      tipo: "planejamento_recusado",
      mensagem: `Seu planejamento "${titulo}" foi recusado.`,
      motivo,
      planId,
    })
  );
}
export function deletePlanejamento(unidadeId, planId) {
  return deleteDoc(doc(db, "unidades", unidadeId, "planejamentos", planId));
}

/* ---------- Notificações ---------- */
export function watchNotificacoesUnidade(unidadeId, cb) {
  return onSnapshot(
    query(collection(db, "unidades", unidadeId, "notificacoes"), orderBy("criadoEm", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
function criarNotificacaoUnidade(unidadeId, dados) {
  return addDoc(collection(db, "unidades", unidadeId, "notificacoes"), {
    ...dados, lida: false, criadoEm: serverTimestamp(),
  });
}
export function marcarNotificacoesUnidadeLidas(unidadeId, ids) {
  return Promise.all(
    ids.map((id) => updateDoc(doc(db, "unidades", unidadeId, "notificacoes", id), { lida: true }))
  );
}
export function watchNotificacoesLideranca(cb) {
  return onSnapshot(
    query(collection(db, "notificacoesLideranca"), orderBy("criadoEm", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
function criarNotificacaoLideranca(dados) {
  return addDoc(collection(db, "notificacoesLideranca"), {
    ...dados, lida: false, criadoEm: serverTimestamp(),
  });
}
export function marcarNotificacoesLiderancaLidas(ids) {
  return Promise.all(
    ids.map((id) => updateDoc(doc(db, "notificacoesLideranca", id), { lida: true }))
  );
}

/* ---------- Planejamento do Clube (calendário privado) ---------- */
export function watchPlanejamentoClube(cb) {
  return onSnapshot(
    query(collection(db, "planejamentoClube"), orderBy("data", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
export function addEventoClube(dados) {
  return addDoc(collection(db, "planejamentoClube"), { ...dados, criadoEm: serverTimestamp() });
}
export function updateEventoClube(eventoId, dados) {
  return updateDoc(doc(db, "planejamentoClube", eventoId), dados);
}
export function deleteEventoClube(eventoId) {
  return deleteDoc(doc(db, "planejamentoClube", eventoId));
}
/* Só grava o planejamento padrão se a coleção ainda estiver vazia
   — evita duplicar se a liderança clicar duas vezes. */
export async function seedPlanejamentoClube(eventos) {
  const snap = await getDocs(collection(db, "planejamentoClube"));
  if (!snap.empty) return false;
  await Promise.all(eventos.map((ev) => addEventoClube(ev)));
  return true;
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

/* ---------- Mídia: pastas com fotos enviadas direto pelo painel ----------
   A pasta em si é só um nome no Firestore; as fotos ficam no
   Firebase Storage, em "midia/{pastaId}/{nomeDoArquivo}" — sem
   redimensionar nada, então baixar sempre pega o arquivo original.
   Pastas antigas (criadas quando a Mídia usava link do Google
   Drive) ainda têm o campo "link" — tratado como caso legado nas
   páginas que exibem a Mídia. */
export function watchMidia(cb) {
  return onSnapshot(query(collection(db, "midia"), orderBy("criadoEm", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export function addPastaMidia(nome) {
  return addDoc(collection(db, "midia"), { nome, criadoEm: serverTimestamp() });
}
export async function deletePastaMidia(pastaId) {
  const fotos = await listarFotosMidia(pastaId);
  await Promise.all(fotos.map((f) => deleteFotoMidia(pastaId, f.nome)));
  await deleteDoc(doc(db, "midia", pastaId));
}

/* contentDisposition "attachment" garante que o botão de baixar
   force o download do arquivo original (em vez de só abrir a foto
   numa aba), já que o Storage fica num domínio diferente do site. */
export function uploadFotoMidia(pastaId, arquivo) {
  return uploadBytes(ref(storage, `midia/${pastaId}/${arquivo.name}`), arquivo, {
    contentDisposition: `attachment; filename="${arquivo.name}"`,
  });
}
export async function listarFotosMidia(pastaId) {
  const lista = await listAll(ref(storage, `midia/${pastaId}`));
  return Promise.all(
    lista.items.map(async (item) => ({ nome: item.name, url: await getDownloadURL(item) }))
  );
}
export function deleteFotoMidia(pastaId, nomeArquivo) {
  return deleteObject(ref(storage, `midia/${pastaId}/${nomeArquivo}`));
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
  const planejamentos = {};
  for (const u of RS_UNIDADES) {
    const mSnap = await getDocs(collection(db, "unidades", u.id, "membros"));
    const lista = [];
    for (const m of mSnap.docs) {
      const rSnap = await getDocs(collection(db, "unidades", u.id, "membros", m.id, "registros"));
      const eSnap = await getDocs(collection(db, "unidades", u.id, "membros", m.id, "especialidades"));
      const matSnap = await getDocs(collection(db, "unidades", u.id, "membros", m.id, "materiais"));
      lista.push({
        id: m.id,
        ...m.data(),
        registros: rSnap.docs.map((r) => ({ id: r.id, ...r.data() })),
        especialidades: eSnap.docs.map((e) => ({ id: e.id, ...e.data() })),
        materiaisFaltando: matSnap.docs.map((mt) => ({ id: mt.id, ...mt.data() })),
      });
    }
    membros[u.id] = lista;

    const pSnap = await getDocs(collection(db, "unidades", u.id, "planejamentos"));
    planejamentos[u.id] = pSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
  }
  const lavajatoSnap = await getDocs(collection(db, "lavajato"));
  const domingosSnap = await getDocs(collection(db, "lavajato_domingos"));
  const midiaSnap = await getDocs(collection(db, "midia"));
  const camporiDoc = await getDoc(doc(db, "config", "campori"));
  const planejamentoClubeSnap = await getDocs(collection(db, "planejamentoClube"));

  const payload = {
    tipo: "rs-backup-completo",
    exportadoEm: new Date().toISOString(),
    membros,
    planejamentos,
    lavajato: lavajatoSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lavajatoDomingos: domingosSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    midia: midiaSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    campori: camporiDoc.exists() ? camporiDoc.data() : null,
    planejamentoClube: planejamentoClubeSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
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
