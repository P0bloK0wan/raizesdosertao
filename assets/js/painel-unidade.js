/* =========================================================
   Painel da Unidade
   ========================================================= */

import { RS_UNIDADES, RS_TOPICOS_PADRAO, RS_PLANEJAMENTO_STATUS } from "./data.js";
import { exigirSessao, logout } from "./auth.js";
import {
  watchMembros, addMembro, deleteMembro,
  watchConselheiros, addConselheiro, deleteConselheiro,
  watchRegistrosMembro, addRegistro, deleteRegistro,
  watchEspecialidadesMembro, addEspecialidade, updateEspecialidade, deleteEspecialidade,
  watchMateriaisMembro, addMaterial, toggleMaterial, deleteMaterial,
  watchPresencas, salvarPresenca, deletePresenca,
  watchPontuacaoAcampamento,
  watchPlanejamentos, addPlanejamento, editarPlanejamento,
  watchNotificacoesUnidade, marcarNotificacoesUnidadeLidas, deleteNotificacaoUnidade,
  criarNotificacaoLideranca,
  watchPedidoSenha, solicitarTrocaSenha,
  watchIdentidadeUnidade,
  verificarDesbloqueio,
} from "./store.js";
import { criarCalendarioClube } from "./calendario-clube.js";
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

/* Observa uma subcoleção por-desbravador (registros, especialidades,
   materiais...), adicionando/removendo watchers conforme membros
   são cadastrados/excluídos. */
function criarFanOutPorMembro(unidadeId, watchFn, onChange) {
  const unsubs = new Map();
  const dados = {};
  return {
    dados,
    sincronizar(membros) {
      const idsAtuais = new Set(membros.map((m) => m.id));
      for (const [mid, unsub] of unsubs) {
        if (!idsAtuais.has(mid)) {
          unsub();
          unsubs.delete(mid);
          delete dados[mid];
        }
      }
      membros.forEach((m) => {
        if (unsubs.has(m.id)) return;
        const unsub = watchFn(unidadeId, m.id, (items) => {
          dados[m.id] = items;
          onChange();
        });
        unsubs.set(m.id, unsub);
      });
    },
  };
}

function iniciarPainel(unidadeId) {
  const estado = { membros: [], conselheiros: [], planejamentos: [], notificacoes: [], presencas: [], pontuacao: [] };
  const abertosRequisitos = new Set();
  const abertosEspecialidades = new Set();
  const abertosMateriais = new Set();

  const nomeUnidade = (RS_UNIDADES.find((u) => u.id === unidadeId) || {}).nome || unidadeId;

  /* Avisa a liderança (sino de notificações dela) de qualquer alteração
     que a unidade fizer no próprio painel. */
  function avisarLideranca(mensagem) {
    criarNotificacaoLideranca({ tipo: "unidade_alterou", mensagem: `${nomeUnidade}: ${mensagem}`, unidadeId });
  }

  /* Excluir desbravador/conselheiro exige uma senha temporária de 24h
     gerada pela liderança. Uma vez validada, fica guardada no localStorage
     (só conveniência — quem garante o limite de 24h de verdade é a regra
     do Firestore) até expirar, sem precisar digitar de novo. */
  async function pedirDesbloqueioSeNecessario() {
    const chaveCache = `rs_desbloqueio_${unidadeId}`;
    const validoAte = localStorage.getItem(chaveCache);
    if (validoAte && new Date(validoAte) > new Date()) return true;

    const codigo = prompt(
      "Excluir um desbravador ou conselheiro exige uma senha temporária da diretoria (válida por 24h). Peça a senha à liderança e digite aqui:"
    );
    if (!codigo) return false;
    const expiraEm = await verificarDesbloqueio(unidadeId, codigo.trim());
    if (!expiraEm) {
      mostrarToast("Senha inválida ou expirada.");
      return false;
    }
    localStorage.setItem(chaveCache, expiraEm.toISOString());
    return true;
  }

  const fanOutRegistros = criarFanOutPorMembro(unidadeId, watchRegistrosMembro, () => { renderRequisitos(); renderStats(); });
  const fanOutEspecialidades = criarFanOutPorMembro(unidadeId, watchEspecialidadesMembro, () => { renderEspecialidades(); renderStats(); });
  const fanOutMateriais = criarFanOutPorMembro(unidadeId, watchMateriaisMembro, () => { renderMateriais(); });

  watchMembros(unidadeId, (membros) => {
    estado.membros = membros;
    fanOutRegistros.sincronizar(membros);
    fanOutEspecialidades.sincronizar(membros);
    fanOutMateriais.sincronizar(membros);

    renderMembros();
    renderChamadaAtual();
    renderHistoricoPresencas();
    renderRequisitos();
    renderEspecialidades();
    renderMateriais();
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
        <td>${m.idade ?? "—"}</td>
        <td>${m.classe || "—"}</td>
        <td>${m.responsavel || "—"}</td>
        <td>${m.telefone || "—"}</td>
        <td>${m.tipoSanguineo || "—"}</td>
        <td class="row-actions"><button class="danger" data-del="${m.id}">Excluir</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const m = estado.membros.find((x) => x.id === btn.dataset.del);
        if (!(await pedirDesbloqueioSeNecessario())) return;
        if (!confirm("Excluir este desbravador? Todo o histórico dele também será perdido.")) return;
        await deleteMembro(unidadeId, btn.dataset.del);
        avisarLideranca(`excluiu o desbravador "${m ? m.nome : btn.dataset.del}".`);
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
      idade: document.getElementById("m-idade").value ? Number(document.getElementById("m-idade").value) : null,
      classe: document.getElementById("m-classe").value,
      tipoSanguineo: document.getElementById("m-tipo-sanguineo").value,
      responsavel: document.getElementById("m-responsavel").value.trim(),
      parentesco: document.getElementById("m-parentesco").value.trim(),
      telefone: document.getElementById("m-telefone").value.trim(),
      responsavel2Nome: document.getElementById("m-responsavel2").value.trim(),
      responsavel2Telefone: document.getElementById("m-telefone2").value.trim(),
      observacoesResponsavel: document.getElementById("m-observacoes-responsavel").value.trim(),
    });
    modalMembro.classList.remove("show");
    const nomeCadastrado = document.getElementById("m-nome").value.trim();
    e.target.reset();
    avisarLideranca(`cadastrou o desbravador "${nomeCadastrado}".`);
    mostrarToast("Desbravador cadastrado.");
  });

  /* ---------------- Conselheiros ---------------- */
  watchConselheiros(unidadeId, (conselheiros) => {
    estado.conselheiros = conselheiros;
    renderConselheiros();
  });

  function renderConselheiros() {
    const tbody = document.getElementById("tbody-conselheiros");
    const vazio = document.getElementById("conselheiros-vazio");
    vazio.style.display = estado.conselheiros.length ? "none" : "block";

    tbody.innerHTML = estado.conselheiros
      .map(
        (c) => `<tr>
        <td>${c.nome}</td>
        <td>${c.idade ?? "—"}</td>
        <td>${c.telefone || "—"}</td>
        <td class="row-actions"><button class="danger" data-del-cs="${c.id}">Excluir</button></td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-del-cs]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const c = estado.conselheiros.find((x) => x.id === btn.dataset.delCs);
        if (!(await pedirDesbloqueioSeNecessario())) return;
        if (!confirm("Excluir este conselheiro?")) return;
        await deleteConselheiro(unidadeId, btn.dataset.delCs);
        avisarLideranca(`excluiu o conselheiro "${c ? c.nome : btn.dataset.delCs}".`);
        mostrarToast("Conselheiro removido.");
      })
    );
  }

  const modalConselheiro = document.getElementById("modal-conselheiro");
  document.getElementById("btn-novo-conselheiro").addEventListener("click", () => modalConselheiro.classList.add("show"));
  document.getElementById("btn-cancelar-conselheiro").addEventListener("click", () => modalConselheiro.classList.remove("show"));
  document.getElementById("form-conselheiro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nomeCs = document.getElementById("cs-nome").value.trim();
    await addConselheiro(unidadeId, {
      nome: nomeCs,
      idade: document.getElementById("cs-idade").value ? Number(document.getElementById("cs-idade").value) : null,
      telefone: document.getElementById("cs-telefone").value.trim(),
    });
    modalConselheiro.classList.remove("show");
    e.target.reset();
    avisarLideranca(`cadastrou o conselheiro "${nomeCs}".`);
    mostrarToast("Conselheiro cadastrado.");
  });

  /* ---------------- Presença / chamada por reunião ---------------- */
  watchPresencas(unidadeId, (presencas) => {
    estado.presencas = presencas;
    renderChamadaAtual();
    renderHistoricoPresencas();
  });

  const inputDataChamada = document.getElementById("pr-data");
  inputDataChamada.value = hojeISO();
  inputDataChamada.addEventListener("change", renderChamadaAtual);

  function renderChamadaAtual() {
    const wrap = document.getElementById("lista-chamada");
    const vazio = document.getElementById("chamada-vazio");
    if (!wrap) return;
    vazio.style.display = estado.membros.length ? "none" : "block";
    const existente = estado.presencas.find((p) => p.id === inputDataChamada.value);
    const presentesAtuais = new Set(existente ? existente.presentes : []);
    wrap.innerHTML = estado.membros
      .map(
        (m) => `<label class="presenca-row">
          <input type="checkbox" data-presente="${m.id}" ${presentesAtuais.has(m.id) ? "checked" : ""}>
          ${m.nome}
        </label>`
      )
      .join("");
  }

  document.getElementById("btn-salvar-presenca").addEventListener("click", async () => {
    const data = inputDataChamada.value;
    if (!data) { mostrarToast("Escolha uma data."); return; }
    const presentes = Array.from(document.querySelectorAll("#lista-chamada input:checked")).map((el) => el.dataset.presente);
    await salvarPresenca(unidadeId, data, presentes);
    avisarLideranca(`fez a chamada de ${fmtDataBr(data)} (${presentes.length} de ${estado.membros.length} presentes).`);
    mostrarToast("Chamada salva.");
  });

  function renderHistoricoPresencas() {
    const tbody = document.getElementById("tbody-presencas");
    const vazio = document.getElementById("presencas-vazio");
    if (!tbody) return;
    vazio.style.display = estado.presencas.length ? "none" : "block";
    tbody.innerHTML = estado.presencas
      .map(
        (p) => `<tr>
          <td>${fmtDataBr(p.data)}</td>
          <td>${(p.presentes || []).length} de ${estado.membros.length}</td>
          <td class="row-actions"><button class="danger" data-del-presenca="${p.id}">Excluir</button></td>
        </tr>`
      )
      .join("");
    tbody.querySelectorAll("[data-del-presenca]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const p = estado.presencas.find((x) => x.id === btn.dataset.delPresenca);
        if (!confirm("Excluir esta chamada?")) return;
        await deletePresenca(unidadeId, btn.dataset.delPresenca);
        avisarLideranca(`excluiu a chamada de ${fmtDataBr(p ? p.data : "")}.`);
        mostrarToast("Chamada removida.");
      })
    );
  }

  /* ---------------- Placar do Acampamento (só leitura) ---------------- */
  watchPontuacaoAcampamento((lancamentos) => {
    estado.pontuacao = lancamentos;
    renderPlacar();
  });

  function renderPlacar() {
    const ranking = document.getElementById("placar-ranking");
    const historico = document.getElementById("placar-historico");
    if (!ranking) return;
    const totais = RS_UNIDADES.map((u) => {
      const doUnidade = estado.pontuacao.filter((l) => l.unidadeId === u.id);
      const total = doUnidade.reduce((soma, l) => soma + (l.tipo === "perdeu" ? -l.pontos : l.pontos), 0);
      return { ...u, total };
    }).sort((a, b) => b.total - a.total);

    ranking.innerHTML = totais
      .map(
        (u, i) => `<div class="placar-linha ${u.id === unidadeId ? "placar-minha" : ""}">
          <span class="placar-pos">${i + 1}º</span>
          <span class="placar-nome">${u.nome}${u.id === unidadeId ? " (sua unidade)" : ""}</span>
          <span class="placar-pontos">${u.total} pts</span>
        </div>`
      )
      .join("");

    historico.innerHTML = estado.pontuacao.length
      ? estado.pontuacao
          .map((l) => {
            const nomeUnidade = RS_UNIDADES.find((u) => u.id === l.unidadeId)?.nome || l.unidadeId;
            return `<div class="placar-log-item">
              <span class="pill ${l.tipo === "perdeu" ? "pill-closed" : "pill-open"}">${l.tipo === "perdeu" ? "−" : "+"}${l.pontos} — ${nomeUnidade}</span>
              ${l.motivo ? `<span class="muted">${l.motivo}</span>` : ""}
            </div>`;
          })
          .join("")
      : `<div class="empty-state">Nenhum lançamento ainda.</div>`;
  }

  /* ---------------- Requisitos: histórico individual por desbravador ---------------- */
  function renderRequisitos() {
    const wrap = document.getElementById("lista-requisitos");
    const vazio = document.getElementById("requisitos-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const regs = fanOutRegistros.dados[m.id] || [];
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
        <details class="month-acc" data-membro-acc="${m.id}"${abertosRequisitos.has(m.id) ? " open" : ""}>
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
        if (det.open) abertosRequisitos.add(det.dataset.membroAcc);
        else abertosRequisitos.delete(det.dataset.membroAcc);
      })
    );

    wrap.querySelectorAll("[data-del-registro]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, rid] = btn.dataset.delRegistro.split(":");
        const m = estado.membros.find((x) => x.id === mid);
        if (!confirm("Excluir este registro?")) return;
        await deleteRegistro(unidadeId, mid, rid);
        avisarLideranca(`excluiu um registro de requisito de ${m ? m.nome : mid}.`);
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
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`lançou o requisito "${criterio}" pra ${m ? m.nome : membroId}.`);
        mostrarToast("Registro adicionado.");
      });
    });
  }

  /* ---------------- Especialidades ---------------- */
  function renderEspecialidades() {
    const wrap = document.getElementById("lista-especialidades");
    const vazio = document.getElementById("especialidades-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const lista = fanOutEspecialidades.dados[m.id] || [];
        const itens = lista
          .map(
            (e) => `
          <li class="esp-item" data-esp="${m.id}:${e.id}">
            <div class="esp-linha">
              <input class="esp-nome" value="${e.nome || ""}" placeholder="Nome da especialidade">
              <select class="esp-status">
                <option value="pendente" ${e.status === "pendente" ? "selected" : ""}>Pendente</option>
                <option value="andamento" ${e.status === "andamento" ? "selected" : ""}>Em andamento</option>
                <option value="concluida" ${e.status === "concluida" ? "selected" : ""}>Concluída</option>
              </select>
            </div>
            <div class="esp-linha">
              <input class="esp-instrutor" value="${e.instrutor || ""}" placeholder="Instrutor/responsável">
              <input type="date" class="esp-data-inicio" value="${e.dataInicio || ""}">
            </div>
            <textarea class="esp-concluido" rows="2" placeholder="O que já foi concluído">${e.concluido || ""}</textarea>
            <textarea class="esp-falta" rows="2" placeholder="O que ainda falta">${e.falta || ""}</textarea>
            <textarea class="esp-materiais" rows="2" placeholder="Materiais necessários">${e.materiais || ""}</textarea>
            <textarea class="esp-observacoes" rows="2" placeholder="Observações">${e.observacoes || ""}</textarea>
            <div class="esp-linha">
              <button type="button" class="btn btn-outline btn-sm esp-salvar">Salvar alterações</button>
              <button type="button" class="danger" data-del-esp="${m.id}:${e.id}">Excluir</button>
            </div>
          </li>`
          )
          .join("");
        return `
        <details class="month-acc" data-esp-acc="${m.id}"${abertosEspecialidades.has(m.id) ? " open" : ""}>
          <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${lista.length} especialidade(s))</span></summary>
          <div style="padding:14px 20px 18px;">
            <ul class="esp-list">${itens || "<li class='muted' style='border:none;'>Nenhuma especialidade cadastrada ainda.</li>"}</ul>
            <form class="registro-add-form" data-form-esp="${m.id}">
              <div class="field"><label>Nova especialidade</label><input type="text" class="esp-nova-nome" placeholder="ex.: Acampamento" required></div>
              <button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </details>`;
      })
      .join("");

    wrap.querySelectorAll("[data-esp-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) abertosEspecialidades.add(det.dataset.espAcc);
        else abertosEspecialidades.delete(det.dataset.espAcc);
      })
    );

    wrap.querySelectorAll("[data-form-esp]").forEach((form) =>
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const membroId = form.dataset.formEsp;
        const nome = form.querySelector(".esp-nova-nome").value.trim();
        if (!nome) return;
        await addEspecialidade(unidadeId, membroId, { nome, status: "pendente", instrutor: "", dataInicio: "", concluido: "", falta: "", materiais: "", observacoes: "" });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`cadastrou a especialidade "${nome}" pra ${m ? m.nome : membroId}.`);
        mostrarToast("Especialidade adicionada.");
      })
    );

    wrap.querySelectorAll("[data-esp]").forEach((li) => {
      const [membroId, espId] = li.dataset.esp.split(":");
      li.querySelector(".esp-salvar").addEventListener("click", async () => {
        const nomeEsp = li.querySelector(".esp-nome").value.trim();
        await updateEspecialidade(unidadeId, membroId, espId, {
          nome: nomeEsp,
          status: li.querySelector(".esp-status").value,
          instrutor: li.querySelector(".esp-instrutor").value.trim(),
          dataInicio: li.querySelector(".esp-data-inicio").value,
          concluido: li.querySelector(".esp-concluido").value.trim(),
          falta: li.querySelector(".esp-falta").value.trim(),
          materiais: li.querySelector(".esp-materiais").value.trim(),
          observacoes: li.querySelector(".esp-observacoes").value.trim(),
        });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`atualizou a especialidade "${nomeEsp}" de ${m ? m.nome : membroId}.`);
        mostrarToast("Especialidade atualizada.");
      });
    });
    wrap.querySelectorAll("[data-del-esp]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, eid] = btn.dataset.delEsp.split(":");
        const m = estado.membros.find((x) => x.id === mid);
        if (!confirm("Excluir esta especialidade?")) return;
        await deleteEspecialidade(unidadeId, mid, eid);
        avisarLideranca(`excluiu uma especialidade de ${m ? m.nome : mid}.`);
        mostrarToast("Especialidade removida.");
      })
    );
  }

  /* ---------------- Materiais: o que falta comprar ---------------- */
  function renderMateriais() {
    const wrap = document.getElementById("lista-materiais");
    const vazio = document.getElementById("materiais-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const lista = fanOutMateriais.dados[m.id] || [];
        const pendentes = lista.filter((it) => it.status !== "comprado").length;
        const itens = lista
          .map(
            (it) => `<li data-mat="${m.id}:${it.id}" class="${it.status === "comprado" ? "comprado" : ""}">
              <span class="mat-nome">${it.nome}</span>
              ${it.especialidade ? `<span class="muted">(${it.especialidade})</span>` : ""}
              <button type="button" class="btn btn-sm ${it.status === "comprado" ? "btn-outline" : "btn-primary"}" data-toggle-mat="${m.id}:${it.id}:${it.status}">${it.status === "comprado" ? "✓ Comprado" : "Marcar comprado"}</button>
              <button type="button" data-del-mat="${m.id}:${it.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
            </li>`
          )
          .join("");
        return `
        <details class="month-acc" data-mat-acc="${m.id}"${abertosMateriais.has(m.id) ? " open" : ""}>
          <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${pendentes} pendente(s) de ${lista.length})</span></summary>
          <div style="padding:14px 20px 18px;">
            <ul class="mat-list">${itens || "<li class='muted' style='border:none;'>Nenhum item cadastrado ainda.</li>"}</ul>
            <form class="registro-add-form" data-form-mat="${m.id}">
              <div class="field"><label>Item</label><input type="text" class="mat-novo-nome" placeholder="ex.: Cantil" required></div>
              <div class="field"><label>Especialidade (opcional)</label><input type="text" class="mat-nova-esp" placeholder="ex.: Acampamento"></div>
              <button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </details>`;
      })
      .join("");

    wrap.querySelectorAll("[data-mat-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) abertosMateriais.add(det.dataset.matAcc);
        else abertosMateriais.delete(det.dataset.matAcc);
      })
    );
    wrap.querySelectorAll("[data-form-mat]").forEach((form) =>
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const membroId = form.dataset.formMat;
        const nome = form.querySelector(".mat-novo-nome").value.trim();
        if (!nome) return;
        await addMaterial(unidadeId, membroId, { nome, especialidade: form.querySelector(".mat-nova-esp").value.trim() });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`adicionou "${nome}" na lista de compras de ${m ? m.nome : membroId}.`);
        mostrarToast("Item adicionado.");
      })
    );
    wrap.querySelectorAll("[data-toggle-mat]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, iid, statusAtual] = btn.dataset.toggleMat.split(":");
        const novoStatus = statusAtual === "comprado" ? "pendente" : "comprado";
        await toggleMaterial(unidadeId, mid, iid, novoStatus);
        const item = (fanOutMateriais.dados[mid] || []).find((x) => x.id === iid);
        const m = estado.membros.find((x) => x.id === mid);
        avisarLideranca(`marcou "${item ? item.nome : iid}" (${m ? m.nome : mid}) como ${novoStatus}.`);
      })
    );
    wrap.querySelectorAll("[data-del-mat]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, iid] = btn.dataset.delMat.split(":");
        const item = (fanOutMateriais.dados[mid] || []).find((x) => x.id === iid);
        const m = estado.membros.find((x) => x.id === mid);
        if (!confirm("Excluir este item?")) return;
        await deleteMaterial(unidadeId, mid, iid);
        avisarLideranca(`excluiu "${item ? item.nome : iid}" da lista de compras de ${m ? m.nome : mid}.`);
        mostrarToast("Item removido.");
      })
    );
  }

  /* ---------------- Planejamento ---------------- */
  watchPlanejamentos(unidadeId, (lista) => { estado.planejamentos = lista; renderPlanejamento(); renderStats(); });

  function renderPlanejamento() {
    const wrap = document.getElementById("lista-planejamento");
    const vazio = document.getElementById("planejamento-vazio");
    vazio.style.display = estado.planejamentos.length ? "none" : "block";

    wrap.innerHTML = estado.planejamentos
      .map((p) => {
        const pillClasse = p.status === "aprovado" ? "pill-open" : p.status === "recusado" ? "pill-closed" : "pill-pending";
        return `
        <div class="card" style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
            <h3 style="margin:0;">${p.titulo}</h3>
            <span class="pill ${pillClasse}">${RS_PLANEJAMENTO_STATUS[p.status] || p.status}</span>
          </div>
          <p class="muted" style="margin:6px 0 0;">${fmtDataBr(p.data)} às ${p.horario || "—"} · ${p.local || "—"}</p>
          <p style="margin:8px 0 0;"><strong>Objetivo:</strong> ${p.objetivo || "—"}</p>
          <p style="margin:6px 0 0;">${p.descricao || ""}</p>
          ${p.observacoes ? `<p class="muted" style="margin:6px 0 0;"><strong>Observações:</strong> ${p.observacoes}</p>` : ""}
          ${p.status === "recusado" ? `<div class="alert alert-error show" style="margin-top:10px;"><strong>Motivo da recusa:</strong> ${p.motivoRecusa}</div>` : ""}
          ${p.status !== "aprovado" ? `<button type="button" class="btn btn-outline btn-sm" style="margin-top:10px;" data-editar-planejamento="${p.id}">Editar${p.status === "recusado" ? " e reenviar" : ""}</button>` : ""}
        </div>`;
      })
      .join("");

    wrap.querySelectorAll("[data-editar-planejamento]").forEach((btn) =>
      btn.addEventListener("click", () => abrirModalPlanejamento(btn.dataset.editarPlanejamento))
    );
  }

  const modalPlanejamento = document.getElementById("modal-planejamento");
  const formPlanejamento = document.getElementById("form-planejamento");
  let planejamentoEmEdicao = null;

  function abrirModalPlanejamento(planId) {
    planejamentoEmEdicao = planId || null;
    const titulo = document.getElementById("modal-planejamento-titulo");
    if (planId) {
      const p = estado.planejamentos.find((x) => x.id === planId);
      titulo.textContent = "Editar proposta de planejamento";
      document.getElementById("pl-titulo").value = p.titulo || "";
      document.getElementById("pl-data").value = p.data || "";
      document.getElementById("pl-horario").value = p.horario || "";
      document.getElementById("pl-local").value = p.local || "";
      document.getElementById("pl-objetivo").value = p.objetivo || "";
      document.getElementById("pl-descricao").value = p.descricao || "";
      document.getElementById("pl-observacoes").value = p.observacoes || "";
    } else {
      titulo.textContent = "Nova proposta de planejamento";
      formPlanejamento.reset();
    }
    modalPlanejamento.classList.add("show");
  }

  document.getElementById("btn-novo-planejamento").addEventListener("click", () => abrirModalPlanejamento(null));
  document.getElementById("btn-cancelar-planejamento").addEventListener("click", () => modalPlanejamento.classList.remove("show"));
  formPlanejamento.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      titulo: document.getElementById("pl-titulo").value.trim(),
      data: document.getElementById("pl-data").value,
      horario: document.getElementById("pl-horario").value,
      local: document.getElementById("pl-local").value.trim(),
      objetivo: document.getElementById("pl-objetivo").value.trim(),
      descricao: document.getElementById("pl-descricao").value.trim(),
      observacoes: document.getElementById("pl-observacoes").value.trim(),
    };
    if (planejamentoEmEdicao) {
      await editarPlanejamento(unidadeId, planejamentoEmEdicao, dados);
      avisarLideranca(`editou e reenviou a proposta "${dados.titulo}" pra aprovação.`);
      mostrarToast("Proposta atualizada e reenviada pra aprovação.");
    } else {
      await addPlanejamento(unidadeId, dados);
      mostrarToast("Proposta enviada pra aprovação.");
    }
    modalPlanejamento.classList.remove("show");
  });

  /* ---------------- Planejamento do Clube (só leitura) ---------------- */
  const modalDetalheEvento = document.getElementById("modal-evento-detalhe");
  criarCalendarioClube({
    aoClicarEvento: (ev) => {
      document.getElementById("detalhe-nome").textContent = ev.nome;
      document.getElementById("detalhe-data").textContent =
        `${fmtDataBr(ev.data)}${ev.dataFim && ev.dataFim !== ev.data ? " a " + fmtDataBr(ev.dataFim) : ""}${ev.horario ? " · " + ev.horario : ""}`;
      document.getElementById("detalhe-categoria").textContent = ev.categoria;
      document.getElementById("detalhe-descricao").textContent = ev.descricao || "";
      document.getElementById("detalhe-observacoes").textContent = ev.observacoes ? "Observações: " + ev.observacoes : "";
      modalDetalheEvento.classList.add("show");
    },
  });
  document.getElementById("btn-fechar-detalhe").addEventListener("click", () => modalDetalheEvento.classList.remove("show"));

  /* ---------------- Notificações ---------------- */
  const notifDropdown = document.getElementById("notif-dropdown");
  watchNotificacoesUnidade(unidadeId, (lista) => { estado.notificacoes = lista; renderNotificacoes(); });

  function renderNotificacoes() {
    const naoLidas = estado.notificacoes.filter((n) => !n.lida);
    const badge = document.getElementById("notif-badge");
    badge.textContent = naoLidas.length;
    badge.style.display = naoLidas.length ? "inline-block" : "none";

    const listaEl = document.getElementById("notif-lista");
    const vazio = document.getElementById("notif-vazio");
    vazio.style.display = estado.notificacoes.length ? "none" : "block";
    listaEl.innerHTML = estado.notificacoes
      .map((n) => `<div class="notif-item ${n.lida ? "" : "nao-lida"}">
        <span>${n.tipo === "planejamento_aprovado" ? "✅" : "⚠️"}</span>
        <div><p>${n.mensagem}</p>${n.motivo ? `<p class="muted">Motivo: ${n.motivo}</p>` : ""}</div>
        <button type="button" class="notif-del" data-del-notif="${n.id}" aria-label="Remover notificação">✕</button>
      </div>`)
      .join("");
    listaEl.querySelectorAll("[data-del-notif]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNotificacaoUnidade(unidadeId, btn.dataset.delNotif);
      })
    );
  }

  document.getElementById("btn-notif").addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
    if (notifDropdown.classList.contains("show")) {
      const idsNaoLidas = estado.notificacoes.filter((n) => !n.lida).map((n) => n.id);
      if (idsNaoLidas.length) marcarNotificacoesUnidadeLidas(unidadeId, idsNaoLidas);
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".notif-wrap")) notifDropdown.classList.remove("show");
  });

  /* ---------------- Estatísticas ---------------- */
  function renderStats() {
    document.getElementById("s-membros").textContent = estado.membros.length;
    const totalRegistros = Object.values(fanOutRegistros.dados).reduce((acc, regs) => acc + regs.length, 0);
    document.getElementById("s-topicos").textContent = totalRegistros;
    document.getElementById("s-planejamentos").textContent = estado.planejamentos.length;
    const emAndamento = Object.values(fanOutEspecialidades.dados).flat().filter((e) => e.status === "andamento").length;
    document.getElementById("s-especialidades").textContent = emAndamento;
  }

  /* ---------------- Identidade da unidade (logo/grito/cor) — só leitura;
     quem define é a liderança, em "Identidade das Unidades". ---------------- */
  const gritoEl = document.getElementById("grito-de-guerra");
  watchIdentidadeUnidade(unidadeId, (identidade) => {
    if (identidade.logoUrl) document.getElementById("brand-logo").src = identidade.logoUrl;
    if (identidade.gritoDeGuerra) {
      gritoEl.textContent = `"${identidade.gritoDeGuerra}"`;
      gritoEl.style.display = "block";
    } else {
      gritoEl.style.display = "none";
    }
    if (identidade.cor) {
      document.documentElement.style.setProperty("--cor-unidade", identidade.cor);
    }
  });

  /* ---------------- Trocar senha (por aprovação da liderança) ---------------- */
  if (new URLSearchParams(window.location.search).has("senha-trocada")) {
    mostrarToast("Sua senha foi trocada com sucesso, conforme aprovado pela liderança.");
  }

  const senhaPendenteAviso = document.getElementById("senha-pendente-aviso");
  const btnPedirSenha = document.getElementById("btn-pedir-senha");
  watchPedidoSenha(unidadeId, (pedido) => {
    if (pedido && pedido.status === "pendente") {
      senhaPendenteAviso.textContent = "Pedido de troca de senha enviado — aguardando aprovação da liderança.";
      senhaPendenteAviso.style.display = "block";
      btnPedirSenha.disabled = true;
    } else if (pedido && pedido.status === "recusada") {
      senhaPendenteAviso.textContent = `Seu pedido de troca de senha foi recusado. Motivo: ${pedido.motivoRecusa || "não informado"}. Você pode pedir de novo.`;
      senhaPendenteAviso.style.display = "block";
      btnPedirSenha.disabled = false;
    } else {
      senhaPendenteAviso.style.display = "none";
      btnPedirSenha.disabled = false;
    }
  });

  document.getElementById("form-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("senha-erro");
    const ok = document.getElementById("senha-ok");
    erro.classList.remove("show"); ok.classList.remove("show");
    try {
      await solicitarTrocaSenha(unidadeId, document.getElementById("senha-nova").value);
      ok.textContent = "Pedido enviado! Assim que a liderança aprovar, a troca acontece sozinha no seu próximo login.";
      ok.classList.add("show");
      e.target.reset();
    } catch (err) {
      erro.textContent = err.message;
      erro.classList.add("show");
    }
  });
}
