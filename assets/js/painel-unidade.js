/* =========================================================
   Painel da Unidade
   ========================================================= */

import { RS_UNIDADES, RS_TOPICOS_PADRAO } from "./data.js";
import { exigirSessao, logout, trocarSenha } from "./auth.js";
import {
  watchMembros, addMembro, deleteMembro,
  watchRegistrosMembro, addRegistro, deleteRegistro,
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

function fmtDataBr(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR");
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function iniciarPainel(unidadeId) {
  const estado = { membros: [], registrosPorMembro: {} };
  const unsubsRegistros = new Map();
  const abertos = new Set(); // ids de membros com o accordion aberto (preservado entre re-renders)

  watchMembros(unidadeId, (membros) => {
    estado.membros = membros;

    const idsAtuais = new Set(membros.map((m) => m.id));
    // remove watchers de membros excluídos
    for (const [mid, unsub] of unsubsRegistros) {
      if (!idsAtuais.has(mid)) {
        unsub();
        unsubsRegistros.delete(mid);
        delete estado.registrosPorMembro[mid];
      }
    }
    // adiciona watchers de membros novos
    membros.forEach((m) => {
      if (unsubsRegistros.has(m.id)) return;
      const unsub = watchRegistrosMembro(unidadeId, m.id, (regs) => {
        estado.registrosPorMembro[m.id] = regs;
        renderRequisitos();
        renderStats();
      });
      unsubsRegistros.set(m.id, unsub);
    });

    renderMembros();
    renderRequisitos();
    renderStats();
  });

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
        <td>${m.tipoSanguineo || "—"}</td>
        <td class="row-actions"><button class="danger" data-del="${m.id}">Excluir</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este desbravador? Todo o histórico de requisitos dele também será perdido.")) return;
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
      tipoSanguineo: document.getElementById("m-tipo-sanguineo").value,
    });
    modalMembro.classList.remove("show");
    e.target.reset();
    mostrarToast("Desbravador cadastrado.");
  });

  /* ---------------- Requisitos: histórico individual por desbravador ---------------- */
  function renderRequisitos() {
    const wrap = document.getElementById("lista-requisitos");
    const vazio = document.getElementById("requisitos-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const regs = estado.registrosPorMembro[m.id] || [];
        const linhas = regs
          .map(
            (r) => `<li data-reg="${r.id}">
              <span class="rg-criterio">${r.criterio}</span>
              <span class="rg-data">${fmtDataBr(r.data)}</span>
              <button data-del-registro="${m.id}:${r.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
            </li>`
          )
          .join("");
        return `
        <details class="month-acc" data-membro-acc="${m.id}"${abertos.has(m.id) ? " open" : ""}>
          <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${regs.length} registro(s))</span></summary>
          <div style="padding:14px 20px 18px;">
            <ul class="registro-list">${linhas || "<li class='muted' style='border:none;'>Nenhum registro lançado ainda.</li>"}</ul>
            <form class="registro-add-form" data-form-registro="${m.id}">
              <div class="field">
                <label>Requisito</label>
                <select class="rg-criterio-select">
                  ${RS_TOPICOS_PADRAO.map((t) => `<option value="${t}">${t}</option>`).join("")}
                  <option value="__outro">Outro...</option>
                </select>
              </div>
              <div class="field rg-outro-wrap" style="display:none;">
                <label>Qual?</label>
                <input type="text" class="rg-outro-input" placeholder="Nome do requisito">
              </div>
              <div class="field">
                <label>Data</label>
                <input type="date" class="rg-data-input" value="${hojeISO()}" required>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </details>`;
      })
      .join("");

    wrap.querySelectorAll("[data-membro-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) abertos.add(det.dataset.membroAcc);
        else abertos.delete(det.dataset.membroAcc);
      })
    );

    wrap.querySelectorAll("[data-del-registro]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, rid] = btn.dataset.delRegistro.split(":");
        if (!confirm("Excluir este registro?")) return;
        await deleteRegistro(unidadeId, mid, rid);
        mostrarToast("Registro removido.");
      })
    );

    wrap.querySelectorAll("[data-form-registro]").forEach((form) => {
      const select = form.querySelector(".rg-criterio-select");
      const outroWrap = form.querySelector(".rg-outro-wrap");
      const outroInput = form.querySelector(".rg-outro-input");
      select.addEventListener("change", () => {
        outroWrap.style.display = select.value === "__outro" ? "block" : "none";
      });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const membroId = form.dataset.formRegistro;
        const criterio = select.value === "__outro" ? outroInput.value.trim() : select.value;
        const data = form.querySelector(".rg-data-input").value;
        if (!criterio || !data) return;
        await addRegistro(unidadeId, membroId, { criterio, data });
        mostrarToast("Registro adicionado.");
      });
    });
  }

  /* ---------------- Estatísticas ---------------- */
  function renderStats() {
    document.getElementById("s-membros").textContent = estado.membros.length;
    const total = Object.values(estado.registrosPorMembro).reduce((acc, regs) => acc + regs.length, 0);
    document.getElementById("s-topicos").textContent = total;
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
