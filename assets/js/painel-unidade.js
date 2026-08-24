/* =========================================================
   Painel da Unidade
   ========================================================= */

import { RS_UNIDADES } from "./data.js";
import { exigirSessao, logout, trocarSenha } from "./auth.js";
import {
  watchMembros, addMembro, deleteMembro,
  watchTopicos, garantirTopicosSeeded, addTopico, toggleTopico, deleteTopico,
} from "./store.js";
import { mostrarToast } from "./main.js";

exigirSessao("unidade", (sessao) => {
  const unidade = RS_UNIDADES.find((u) => u.id === sessao.unidadeId);
  document.getElementById("quem").textContent = sessao.nome;
  document.getElementById("unidade-nome").textContent = "Unidade " + unidade.nome;
  document.getElementById("mobile-title").textContent = "Unidade " + unidade.nome;
  iniciarPainel(sessao.unidadeId);
});

document.getElementById("btn-sair").addEventListener("click", logout);

function iniciarPainel(unidadeId) {
  const estado = { membros: [], topicos: [] };

  garantirTopicosSeeded(unidadeId);

  watchMembros(unidadeId, (membros) => { estado.membros = membros; renderMembros(); renderStats(); });
  watchTopicos(unidadeId, (topicos) => { estado.topicos = topicos; renderTopicos(); renderStats(); });

  /* ---------------- Membros ---------------- */
  function renderMembros() {
    const tbody = document.getElementById("tbody-membros");
    const vazio = document.getElementById("membros-vazio");
    tbody.innerHTML = "";
    vazio.style.display = estado.membros.length ? "none" : "block";

    estado.membros.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.nome}</td>
        <td>${m.nascimento ? new Date(m.nascimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
        <td>${m.classe || "—"}</td>
        <td>${m.responsavel || "—"}</td>
        <td>${m.telefone || "—"}</td>
        <td class="row-actions"><button class="danger" data-del="${m.id}">Excluir</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este desbravador?")) return;
        await deleteMembro(unidadeId, btn.dataset.del);
        mostrarToast("Desbravador removido.");
      })
    );
  }

  const modalMembro = document.getElementById("modal-membro");
  document.getElementById("btn-novo-membro").addEventListener("click", () => modalMembro.classList.add("show"));
  document.getElementById("btn-cancelar-membro").addEventListener("click", () => modalMembro.classList.remove("show"));
  document.getElementById("form-membro").addEventListener("submit", async (e) => {
    e.preventDefault();
    await addMembro(unidadeId, {
      nome: document.getElementById("m-nome").value.trim(),
      nascimento: document.getElementById("m-nascimento").value,
      classe: document.getElementById("m-classe").value,
      responsavel: document.getElementById("m-responsavel").value.trim(),
      telefone: document.getElementById("m-telefone").value.trim(),
    });
    modalMembro.classList.remove("show");
    e.target.reset();
    mostrarToast("Desbravador cadastrado.");
  });

  /* ---------------- Tópicos / atividades ---------------- */
  function renderTopicos() {
    const lista = document.getElementById("lista-topicos");
    const vazio = document.getElementById("topicos-vazio");
    vazio.style.display = estado.topicos.length ? "none" : "block";

    lista.innerHTML = estado.topicos
      .map(
        (t) => `
      <li class="${t.realizado ? "feito" : ""}" data-id="${t.id}">
        <button class="topico-check" data-toggle="${t.id}" aria-label="Marcar como realizado">${t.realizado ? "✓" : ""}</button>
        <span class="tp-nome">${t.nome}</span>
        <button class="row-actions" data-del="${t.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
      </li>`
      )
      .join("");

    lista.querySelectorAll("[data-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const t = estado.topicos.find((x) => x.id === btn.dataset.toggle);
        toggleTopico(unidadeId, btn.dataset.toggle, !t.realizado);
      })
    );
    lista.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir esta atividade?")) return;
        await deleteTopico(unidadeId, btn.dataset.del);
        mostrarToast("Atividade removida.");
      })
    );
  }

  const modalTopico = document.getElementById("modal-topico");
  document.getElementById("btn-novo-topico").addEventListener("click", () => modalTopico.classList.add("show"));
  document.getElementById("btn-cancelar-topico").addEventListener("click", () => modalTopico.classList.remove("show"));
  document.getElementById("form-topico").addEventListener("submit", async (e) => {
    e.preventDefault();
    await addTopico(unidadeId, document.getElementById("tp-nome").value.trim());
    modalTopico.classList.remove("show");
    e.target.reset();
    mostrarToast("Atividade adicionada.");
  });

  /* ---------------- Estatísticas ---------------- */
  function renderStats() {
    document.getElementById("s-membros").textContent = estado.membros.length;
    const feitos = estado.topicos.filter((t) => t.realizado).length;
    document.getElementById("s-topicos").textContent = `${feitos}/${estado.topicos.length}`;
  }

  /* ---------------- Trocar senha ---------------- */
  document.getElementById("form-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("senha-erro");
    const ok = document.getElementById("senha-ok");
    erro.classList.remove("show"); ok.classList.remove("show");
    try {
      await trocarSenha(document.getElementById("senha-atual").value, document.getElementById("senha-nova").value);
      ok.textContent = "Senha atualizada com sucesso!";
      ok.classList.add("show");
      e.target.reset();
    } catch (err) {
      erro.textContent = err.message;
      erro.classList.add("show");
    }
  });
}
