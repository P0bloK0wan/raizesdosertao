/* =========================================================
   Painel da Unidade
   ========================================================= */

import { RS_UNIDADES, RS_CRITERIOS } from "./data.js";
import { exigirSessao, logout, trocarSenha } from "./auth.js";
import {
  watchVagas, garantirVagasSeeded, fecharVaga, reabrirVaga,
  watchMembros, addMembro, deleteMembro,
  watchAvaliacoes, addAvaliacao, deleteAvaliacao,
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

function mediaAvaliacao(a) {
  const soma = RS_CRITERIOS.reduce((acc, c) => acc + Number(a[c.id] || 0), 0);
  return (soma / RS_CRITERIOS.length).toFixed(1);
}

function iniciarPainel(unidadeId) {
  const estado = { vagas: [], membros: [], avaliacoes: [] };

  garantirVagasSeeded();

  watchVagas((vagas) => { estado.vagas = vagas; renderVagas(); });
  watchMembros(unidadeId, (membros) => { estado.membros = membros; renderMembros(); renderAvaliacoes(); });
  watchAvaliacoes(unidadeId, (avaliacoes) => { estado.avaliacoes = avaliacoes; renderAvaliacoes(); });

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

    document.getElementById("s-membros").textContent = estado.membros.length;
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

  /* ---------------- Avaliação semanal ---------------- */
  function renderAvaliacoes() {
    const nomePorId = Object.fromEntries(estado.membros.map((m) => [m.id, m.nome]));
    const avaliacoes = estado.avaliacoes.slice().sort((a, b) => (a.data < b.data ? 1 : -1));
    const tbody = document.getElementById("tbody-avaliacoes");
    const vazio = document.getElementById("avaliacoes-vazio");
    tbody.innerHTML = "";
    vazio.style.display = avaliacoes.length ? "none" : "block";

    avaliacoes.forEach((a) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nomePorId[a.membroId] || "(removido)"}</td>
        <td>${new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
        <td>${a.pontualidade}</td><td>${a.biblia}</td><td>${a.uniforme}</td><td>${a.participacao}</td><td>${a.comportamento}</td>
        <td><strong>${mediaAvaliacao(a)}</strong></td>
        <td class="row-actions"><button class="danger" data-del-av="${a.id}">Excluir</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del-av]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir esta avaliação?")) return;
        await deleteAvaliacao(unidadeId, btn.dataset.delAv);
        mostrarToast("Avaliação removida.");
      })
    );
  }

  const modalAvaliacao = document.getElementById("modal-avaliacao");
  document.getElementById("btn-nova-avaliacao").addEventListener("click", () => {
    const select = document.getElementById("av-membro");
    if (!estado.membros.length) {
      select.innerHTML = `<option disabled>Cadastre desbravadores primeiro</option>`;
    } else {
      select.innerHTML = estado.membros.map((m) => `<option value="${m.id}">${m.nome}</option>`).join("");
    }
    document.getElementById("av-data").value = new Date().toISOString().slice(0, 10);
    modalAvaliacao.classList.add("show");
  });
  document.getElementById("btn-cancelar-avaliacao").addEventListener("click", () => modalAvaliacao.classList.remove("show"));
  document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
    e.preventDefault();
    const membroId = document.getElementById("av-membro").value;
    if (!membroId) return;
    await addAvaliacao(unidadeId, {
      membroId,
      data: document.getElementById("av-data").value,
      pontualidade: Number(document.getElementById("av-pontualidade").value),
      biblia: Number(document.getElementById("av-biblia").value),
      uniforme: Number(document.getElementById("av-uniforme").value),
      participacao: Number(document.getElementById("av-participacao").value),
      comportamento: Number(document.getElementById("av-comportamento").value),
    });
    modalAvaliacao.classList.remove("show");
    mostrarToast("Avaliação salva.");
  });

  /* ---------------- Vagas ---------------- */
  let vagaAlvo = null;
  function renderVagas() {
    const tbody = document.getElementById("tbody-vagas");
    tbody.innerHTML = "";
    const vagasOrdenadas = estado.vagas.slice().sort((a, b) => (a.data > b.data ? 1 : -1));

    vagasOrdenadas.forEach((v) => {
      const minhaVaga = v.unidadeId === unidadeId;
      const fechadaPorOutro = v.unidadeId && !minhaVaga;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.data}</td>
        <td>${v.horario}</td>
        <td>${v.vagas}</td>
        <td><span class="pill ${v.unidadeId ? "pill-closed" : "pill-open"}">
          ${v.unidadeId ? (minhaVaga ? "Fechada pela sua unidade" : "Fechada por outra unidade") : "Aberta"}
        </span></td>
        <td class="row-actions">
          ${!v.unidadeId ? `<button data-fechar="${v.id}">Fechar vaga</button>` : ""}
          ${minhaVaga ? `<button class="danger" data-liberar="${v.id}">Liberar vaga</button>` : ""}
          ${fechadaPorOutro ? `<span class="muted">—</span>` : ""}
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-fechar]").forEach((btn) =>
      btn.addEventListener("click", () => abrirModalFechar(btn.dataset.fechar))
    );
    tbody.querySelectorAll("[data-liberar]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Liberar esta vaga para outra unidade?")) return;
        await reabrirVaga(btn.dataset.liberar);
        mostrarToast("Vaga liberada.");
      })
    );

    const fechadasPelaUnidade = estado.vagas.filter((v) => v.unidadeId === unidadeId).length;
    document.getElementById("s-vagas-fechadas").textContent = fechadasPelaUnidade;
  }

  const modalFechar = document.getElementById("modal-fechar-vaga");
  function abrirModalFechar(vagaId) {
    vagaAlvo = vagaId;
    const select = document.getElementById("fv-membros");
    if (!estado.membros.length) {
      select.innerHTML = `<option disabled>Cadastre desbravadores primeiro</option>`;
    } else {
      select.innerHTML = estado.membros.map((m) => `<option value="${m.nome}">${m.nome}</option>`).join("");
    }
    document.getElementById("fv-responsavel").value = "";
    modalFechar.classList.add("show");
  }
  document.getElementById("btn-cancelar-fechar").addEventListener("click", () => modalFechar.classList.remove("show"));
  document.getElementById("form-fechar-vaga").addEventListener("submit", async (e) => {
    e.preventDefault();
    const selecionados = Array.from(document.getElementById("fv-membros").selectedOptions).map((o) => o.value);
    await fecharVaga(vagaAlvo, unidadeId, document.getElementById("fv-responsavel").value.trim(), selecionados);
    modalFechar.classList.remove("show");
    mostrarToast("Vaga fechada para sua unidade!");
  });

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
