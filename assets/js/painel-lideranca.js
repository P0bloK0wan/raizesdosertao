/* =========================================================
   Painel da Liderança
   ========================================================= */

import {
  RS_UNIDADES, RS_CAMPORI_DATA_PADRAO, RS_LAVAJATO_VAGAS_POR_DOMINGO, rsProximosDomingos,
  RS_PLANEJAMENTO_STATUS, RS_PLANEJAMENTO_CLUBE_CATEGORIAS, RS_PLANEJAMENTO_CLUBE_SEED,
  RS_CORES_UNIDADE,
} from "./data.js";
import { exigirSessao, logout, trocarSenha } from "./auth.js";
import {
  watchLavaJato, deleteRegistroLavaJato,
  watchDomingos, fecharDomingo, abrirDomingo,
  watchMembros, updateMembro, deleteMembro,
  watchRegistrosMembro, deleteRegistro,
  watchEspecialidadesMembro, updateEspecialidade, deleteEspecialidade,
  watchMateriaisMembro, toggleMaterial, deleteMaterial,
  watchPresencas,
  watchPontuacaoAcampamento, addPontuacaoAcampamento, deletePontuacaoAcampamento,
  criarNotificacaoUnidade,
  watchPlanejamentos, aprovarPlanejamento, recusarPlanejamento, deletePlanejamento,
  watchNotificacoesLideranca, marcarNotificacoesLiderancaLidas, deleteNotificacaoLideranca,
  watchPedidoSenha, aprovarTrocaSenha, recusarTrocaSenha,
  watchIdentidadeUnidade, salvarIdentidadeUnidade, watchConselheiros,
  gerarDesbloqueioUnidade,
  addEventoClube, updateEventoClube, deleteEventoClube, seedPlanejamentoClube,
  watchMidia, addPastaMidia, deletePastaMidia,
  watchCampori, setCamporiData,
  exportarBackup,
} from "./store.js";
import { criarCalendarioClube } from "./calendario-clube.js";
import { enviarImagemCloudinary } from "./cloudinary.js";
import { mostrarToast } from "./main.js";

exigirSessao("lideranca", (sessao) => {
  document.getElementById("quem").textContent = sessao.nome;
  iniciarPainel();
});

document.getElementById("btn-sair").addEventListener("click", logout);

function fmtData(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function fmtDataBr(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR");
}
function nomeDaUnidade(id) {
  return (RS_UNIDADES.find((u) => u.id === id) || {}).nome || id;
}

/* Observa uma subcoleção por-desbravador (especialidades,
   materiais...) em TODAS as unidades — usado pela liderança, que
   precisa ver tudo, não só a própria unidade. */
function criarFanOutGlobal(watchFn, onChange) {
  const unsubs = new Map(); // membroId -> unsub
  const dados = {}; // membroId -> items
  return {
    dados,
    sincronizar(unidadeId, membros) {
      membros.forEach((m) => {
        if (unsubs.has(m.id)) return;
        const unsub = watchFn(unidadeId, m.id, (items) => {
          dados[m.id] = items;
          onChange();
        });
        unsubs.set(m.id, unsub);
      });
    },
    limparRemovidos(idsAtuaisGlobais) {
      for (const [mid, unsub] of unsubs) {
        if (!idsAtuaisGlobais.has(mid)) {
          unsub();
          unsubs.delete(mid);
          delete dados[mid];
        }
      }
    },
  };
}

function iniciarPainel() {
  const estado = {
    lavajato: [],
    domingos: {},
    membrosPorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, []])),
    registrosPorMembro: {},
    planejamentosPorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, []])),
    notificacoes: [],
    eventosClube: [],
    midia: [],
    pedidosSenhaPorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, null])),
    identidadePorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, {}])),
    conselheirosPorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, []])),
    presencasPorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, []])),
    pontuacao: [],
  };
  const idsJaNotificados = new Set();
  let primeiraLeitura = true;
  const unsubsRegistros = new Map(); // membroId -> unsub
  const unidadesAbertas = new Set();
  const membrosAbertos = new Set();
  const filtros = { unidade: "", status: "", data: "" };

  /* ---------------- Lava Jato ---------------- */
  watchLavaJato((lista) => {
    // detecta cancelamentos novos pra notificar a liderança
    if (!primeiraLeitura) {
      lista.forEach((r) => {
        if (r.cancelado && !idsJaNotificados.has(r.id) && !estado.lavajato.some((old) => old.id === r.id && old.cancelado)) {
          notificarToast(`⚠️ ${r.nome} cancelou o atendimento do Lava Jato.`, "Cancelamento no Lava Jato", `${r.nome} (${r.placa}) cancelou o atendimento.`);
        }
      });
    }
    lista.forEach((r) => { if (r.cancelado) idsJaNotificados.add(r.id); });
    primeiraLeitura = false;

    estado.lavajato = lista;
    renderLavaJato();
    renderStats();
  });

  function notificarToast(msgToast, tituloNotif, corpoNotif) {
    mostrarToast(msgToast);
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        new Notification(tituloNotif, { body: corpoNotif });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }

  function renderLavaJato() {
    const tbody = document.getElementById("tbody-lavajato");
    const vazio = document.getElementById("lavajato-vazio");
    tbody.innerHTML = "";
    vazio.style.display = estado.lavajato.length ? "none" : "block";

    const ordenados = [...estado.lavajato].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
    ordenados.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fmtDataBr(r.data)}</td>
        <td>${r.nome}</td>
        <td>${r.telefone}</td>
        <td>${r.placa}</td>
        <td>${r.modelo}</td>
        <td>${r.cor}</td>
        <td><span class="pill ${r.cancelado ? "pill-closed" : "pill-open"}">${r.cancelado ? "Cancelado" : "Ativo"}</span></td>
        <td class="row-actions"><button class="danger" data-del="${r.id}" data-del-data="${r.data}">Excluir</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este cadastro do Lava Jato?")) return;
        await deleteRegistroLavaJato(btn.dataset.del, btn.dataset.delData);
        mostrarToast("Cadastro excluído.");
      })
    );

    document.getElementById("lavajato-atualizado").textContent =
      "Atualizado em " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const cancelados = estado.lavajato.filter((r) => r.cancelado).length;
    const badge = document.getElementById("badge-cancelados");
    badge.textContent = cancelados;
    badge.style.display = cancelados ? "inline-block" : "none";
  }

  /* ---------------- Lava Jato: agenda ---------------- */
  watchDomingos((dados) => { estado.domingos = dados; renderAgenda(); });

  function fmtDataCurta(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  function statusDoDia(iso) {
    const info = estado.domingos[iso] || { fechado: false, vagasOcupadas: 0, vagasTotal: RS_LAVAJATO_VAGAS_POR_DOMINGO };
    if (info.fechado) return { ...info, rotulo: "Fechado", classe: "fechado" };
    if (info.vagasOcupadas >= info.vagasTotal) return { ...info, rotulo: "Lotado", classe: "lotado" };
    return { ...info, rotulo: `${info.vagasOcupadas}/${info.vagasTotal}`, classe: "aberto" };
  }

  function renderAgenda() {
    const wrap = document.getElementById("lideranca-agenda");
    const domingos = rsProximosDomingos(8);
    wrap.innerHTML = domingos.map((iso) => {
      const s = statusDoDia(iso);
      return `<button type="button" class="agenda-dia ${s.classe}" data-domingo="${iso}">
        <span class="ag-data">${fmtDataCurta(iso)}</span>
        <span class="ag-status">${s.rotulo}</span>
        ${s.fechado && s.motivo ? `<span class="ag-motivo">${s.motivo}</span>` : ""}
      </button>`;
    }).join("");

    wrap.querySelectorAll("[data-domingo]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const iso = btn.dataset.domingo;
        const s = statusDoDia(iso);
        if (s.fechado) {
          if (!confirm(`Reabrir o domingo ${fmtDataBr(iso)} pro Lava Jato?`)) return;
          await abrirDomingo(iso);
          mostrarToast("Domingo reaberto.");
        } else {
          const motivo = prompt(`Fechar o domingo ${fmtDataBr(iso)}? Se quiser, escreva o motivo (opcional):`, "");
          if (motivo === null) return;
          await fecharDomingo(iso, motivo);
          mostrarToast("Domingo fechado.");
        }
      })
    );
  }

  /* ---------------- Unidades / desbravadores / requisitos ---------------- */
  const fanOutEspecialidades = criarFanOutGlobal(watchEspecialidadesMembro, () => { renderDesbravadores(); renderEspecialidadesLideranca(); renderStats(); });
  const fanOutMateriais = criarFanOutGlobal(watchMateriaisMembro, () => { renderCompras(); renderStats(); });

  function renderDesbravadores() {
    const wrap = document.getElementById("desbravadores-lista");
    wrap.innerHTML = "";
    RS_UNIDADES.forEach((u) => {
      const membros = estado.membrosPorUnidade[u.id] || [];
      const totalRegistros = membros.reduce((acc, m) => acc + (estado.registrosPorMembro[m.id] || []).length, 0);
      const det = document.createElement("details");
      det.className = "month-acc";
      det.dataset.unidadeAcc = u.id;
      if (unidadesAbertas.has(u.id)) det.open = true;
      const blocosMembros = membros
        .map((m) => {
          const regs = estado.registrosPorMembro[m.id] || [];
          const linhasRegs = regs
            .map((r) => `<li>
              <span class="rg-criterio">${r.criterio}</span>
              <span class="rg-data">${fmtDataBr(r.data)}</span>
              <button data-del-registro="${u.id}:${m.id}:${r.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
            </li>`)
            .join("");
          return `
          <details class="month-acc" style="margin-top:8px;" data-membro-acc="${m.id}"${membrosAbertos.has(m.id) ? " open" : ""}>
            <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${m.classe || "sem classe"} · ${regs.length} registro(s))</span>
              <span style="margin-left:auto; display:flex; gap:8px;">
                <button type="button" class="btn btn-outline btn-sm" data-editar-membro="${u.id}:${m.id}">Editar</button>
                <button class="danger" data-del-membro="${u.id}:${m.id}">Excluir</button>
              </span>
            </summary>
            <div style="padding:14px 20px 18px;">
              <p class="muted" style="margin:0 0 8px;">Nascimento: ${m.nascimento || "—"} · Idade: ${m.idade ?? "—"} · Tipo sanguíneo: ${m.tipoSanguineo || "—"}</p>
              <p class="muted" style="margin:0 0 8px;">Responsável: ${m.responsavel || "—"} (${m.parentesco || "—"}) · Telefone: ${m.telefone || "—"}</p>
              ${m.responsavel2Nome ? `<p class="muted" style="margin:0 0 8px;">2º responsável: ${m.responsavel2Nome} · Telefone: ${m.responsavel2Telefone || "—"}</p>` : ""}
              <ul class="registro-list">${linhasRegs || "<li class='muted' style='border:none;'>Nenhum registro lançado ainda.</li>"}</ul>
            </div>
          </details>`;
        })
        .join("");
      const identidade = estado.identidadePorUnidade[u.id] || {};
      det.innerHTML = `
        <summary>${u.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${membros.length} desbravador(es) · ${totalRegistros} registro(s) de requisitos)</span></summary>
        <div style="padding:14px 20px 18px;">
          ${identidade.logoUrl || identidade.gritoDeGuerra ? `
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px dashed var(--border);">
            ${identidade.logoUrl ? `<img src="${identidade.logoUrl}" alt="Logo ${u.nome}" style="width:56px; height:56px; border-radius:50%; object-fit:cover;">` : ""}
            ${identidade.gritoDeGuerra ? `<p style="margin:0; font-style:italic;">"${identidade.gritoDeGuerra}"</p>` : ""}
          </div>` : ""}
          ${(estado.conselheirosPorUnidade[u.id] || []).length ? `
          <p class="muted" style="margin:0 0 6px; font-weight:700;">Conselheiros</p>
          <ul style="margin:0 0 14px; padding-left:18px;">
            ${(estado.conselheirosPorUnidade[u.id] || [])
              .map((c) => `<li>${c.nome}${c.idade ? ` (${c.idade} anos)` : ""}${c.telefone ? ` · ${c.telefone}` : ""}</li>`)
              .join("")}
          </ul>` : ""}
          <p class="muted" style="margin:0 0 6px; font-weight:700;">Presença (últimas chamadas)</p>
          ${(estado.presencasPorUnidade[u.id] || []).length ? `
          <ul style="margin:0 0 14px; padding-left:18px;">
            ${(estado.presencasPorUnidade[u.id] || [])
              .slice(0, 5)
              .map((p) => `<li>${fmtDataBr(p.data)} — ${(p.presentes || []).length} de ${membros.length} presente(s)</li>`)
              .join("")}
          </ul>` : `<p class="empty-state" style="margin-bottom:14px;">Nenhuma chamada registrada ainda.</p>`}
          ${membros.length ? blocosMembros : `<p class="empty-state">Nenhum desbravador cadastrado por esta unidade ainda.</p>`}
        </div>`;
      wrap.appendChild(det);
    });

    wrap.querySelectorAll("[data-unidade-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) unidadesAbertas.add(det.dataset.unidadeAcc);
        else unidadesAbertas.delete(det.dataset.unidadeAcc);
      })
    );
    wrap.querySelectorAll("[data-membro-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) membrosAbertos.add(det.dataset.membroAcc);
        else membrosAbertos.delete(det.dataset.membroAcc);
      })
    );

    wrap.querySelectorAll("[data-del-membro]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const [uid, mid] = btn.dataset.delMembro.split(":");
        const m = (estado.membrosPorUnidade[uid] || []).find((x) => x.id === mid);
        abrirModalMotivo({
          titulo: "Excluir desbravador",
          label: "Motivo da exclusão (obrigatório — a unidade recebe um aviso)",
          textoBotao: "Confirmar exclusão",
          acao: async (motivo) => {
            await deleteMembro(uid, mid);
            await criarNotificacaoUnidade(uid, {
              tipo: "item_alterado",
              mensagem: `A liderança excluiu o cadastro de "${m ? m.nome : mid}".`,
              motivo,
            });
            mostrarToast("Desbravador removido.");
          },
        });
      })
    );
    wrap.querySelectorAll("[data-editar-membro]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const [uid, mid] = btn.dataset.editarMembro.split(":");
        abrirModalEditarMembro(uid, mid);
      })
    );
    wrap.querySelectorAll("[data-del-registro]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [uid, mid, rid] = btn.dataset.delRegistro.split(":");
        const m = (estado.membrosPorUnidade[uid] || []).find((x) => x.id === mid);
        const r = (estado.registrosPorMembro[mid] || []).find((x) => x.id === rid);
        abrirModalMotivo({
          titulo: "Excluir registro",
          label: "Motivo da exclusão (obrigatório — a unidade recebe um aviso)",
          textoBotao: "Confirmar exclusão",
          acao: async (motivo) => {
            await deleteRegistro(uid, mid, rid);
            await criarNotificacaoUnidade(uid, {
              tipo: "item_alterado",
              mensagem: `A liderança excluiu o registro "${r ? r.criterio : ""}" de ${m ? m.nome : mid}.`,
              motivo,
            });
            mostrarToast("Registro removido.");
          },
        });
      })
    );

    renderResponsaveis();
  }

  const modalMembro = document.getElementById("modal-membro-lideranca");
  const formMembroLideranca = document.getElementById("form-membro-lideranca");
  let membroEmEdicao = null;
  function abrirModalEditarMembro(unidadeId, membroId) {
    const m = (estado.membrosPorUnidade[unidadeId] || []).find((x) => x.id === membroId);
    if (!m) return;
    membroEmEdicao = { unidadeId, membroId };
    document.getElementById("mel-nome").value = m.nome || "";
    document.getElementById("mel-nascimento").value = m.nascimento || "";
    document.getElementById("mel-classe").value = m.classe || "";
    document.getElementById("mel-idade").value = m.idade ?? "";
    document.getElementById("mel-tipo-sanguineo").value = m.tipoSanguineo || "";
    document.getElementById("mel-responsavel").value = m.responsavel || "";
    document.getElementById("mel-parentesco").value = m.parentesco || "";
    document.getElementById("mel-telefone").value = m.telefone || "";
    modalMembro.classList.add("show");
  }
  document.getElementById("btn-cancelar-membro-lideranca").addEventListener("click", () => modalMembro.classList.remove("show"));
  formMembroLideranca.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!membroEmEdicao) return;
    const { unidadeId, membroId } = membroEmEdicao;
    const dados = {
      nome: document.getElementById("mel-nome").value.trim(),
      nascimento: document.getElementById("mel-nascimento").value,
      classe: document.getElementById("mel-classe").value,
      idade: document.getElementById("mel-idade").value ? Number(document.getElementById("mel-idade").value) : null,
      tipoSanguineo: document.getElementById("mel-tipo-sanguineo").value,
      responsavel: document.getElementById("mel-responsavel").value.trim(),
      parentesco: document.getElementById("mel-parentesco").value.trim(),
      telefone: document.getElementById("mel-telefone").value.trim(),
    };
    modalMembro.classList.remove("show");
    abrirModalMotivo({
      titulo: "Motivo da edição",
      label: "Por que está editando esse cadastro? (obrigatório — a unidade recebe um aviso)",
      textoBotao: "Salvar edição",
      acao: async (motivo) => {
        await updateMembro(unidadeId, membroId, dados);
        await criarNotificacaoUnidade(unidadeId, {
          tipo: "item_alterado",
          mensagem: `A liderança editou o cadastro de "${dados.nome}".`,
          motivo,
        });
        mostrarToast("Cadastro atualizado.");
      },
    });
  });

  document.getElementById("db-unidade").innerHTML =
    `<option value="">Selecione a unidade</option>` + RS_UNIDADES.map((u) => `<option value="${u.id}">${u.nome}</option>`).join("");

  document.getElementById("btn-gerar-desbloqueio").addEventListener("click", async () => {
    const unidadeId = document.getElementById("db-unidade").value;
    if (!unidadeId) {
      mostrarToast("Escolha uma unidade primeiro.");
      return;
    }
    const nomeUnidade = RS_UNIDADES.find((u) => u.id === unidadeId)?.nome || unidadeId;
    const codigo = await gerarDesbloqueioUnidade(unidadeId);
    alert(`Senha temporária pra ${nomeUnidade}: ${codigo}\n\nRepasse por telefone ou WhatsApp — vale por 24 horas pra excluir desbravador ou conselheiro.`);
  });

  RS_UNIDADES.forEach((u) => {
    watchMembros(u.id, (membros) => {
      estado.membrosPorUnidade[u.id] = membros;

      const idsGlobais = new Set(Object.values(estado.membrosPorUnidade).flat().map((m) => m.id));
      for (const [mid, unsub] of unsubsRegistros) {
        if (!idsGlobais.has(mid)) {
          unsub();
          unsubsRegistros.delete(mid);
          delete estado.registrosPorMembro[mid];
        }
      }
      membros.forEach((m) => {
        if (unsubsRegistros.has(m.id)) return;
        const unsub = watchRegistrosMembro(u.id, m.id, (regs) => {
          estado.registrosPorMembro[m.id] = regs;
          renderDesbravadores();
        });
        unsubsRegistros.set(m.id, unsub);
      });
      fanOutEspecialidades.limparRemovidos(idsGlobais);
      fanOutMateriais.limparRemovidos(idsGlobais);
      fanOutEspecialidades.sincronizar(u.id, membros);
      fanOutMateriais.sincronizar(u.id, membros);

      renderDesbravadores();
      renderEspecialidadesLideranca();
      renderCompras();
      renderStats();
    });
  });

  /* ---------------- Responsáveis ---------------- */
  function renderResponsaveis() {
    const tbody = document.getElementById("tbody-responsaveis");
    const linhas = [];
    RS_UNIDADES.forEach((u) => {
      (estado.membrosPorUnidade[u.id] || []).forEach((m) => {
        linhas.push(`<tr>
          <td>${m.nome}</td>
          <td>${u.nome}</td>
          <td>${m.responsavel || "—"}</td>
          <td>${m.parentesco || "—"}</td>
          <td>${m.telefone || "—"}</td>
          <td>${m.responsavel2Nome ? `${m.responsavel2Nome} (${m.responsavel2Telefone || "sem telefone"})` : "—"}</td>
        </tr>`);
      });
    });
    tbody.innerHTML = linhas.join("") || `<tr><td colspan="6" class="muted">Nenhum desbravador cadastrado ainda.</td></tr>`;
  }

  /* ---------------- Especialidades — visão geral ---------------- */
  function renderEspecialidadesLideranca() {
    const wrap = document.getElementById("lista-especialidades-lideranca");
    const vazio = document.getElementById("especialidades-lideranca-vazio");
    let total = 0;

    const blocos = RS_UNIDADES.map((u) => {
      const membros = estado.membrosPorUnidade[u.id] || [];
      const linhasMembros = membros
        .map((m) => {
          const lista = fanOutEspecialidades.dados[m.id] || [];
          total += lista.length;
          if (!lista.length) return "";
          const linhasEsp = lista
            .map((e) => `<tr>
              <td>${e.nome}</td>
              <td>
                <select class="esp-status-select" data-esp="${u.id}:${m.id}:${e.id}">
                  <option value="andamento"${e.status === "andamento" ? " selected" : ""}>Em andamento</option>
                  <option value="concluida"${e.status === "concluida" ? " selected" : ""}>Concluída</option>
                  <option value="pendente"${e.status === "pendente" ? " selected" : ""}>Pendente</option>
                </select>
              </td>
              <td>${e.falta || "—"}</td>
              <td>${e.materiais || "—"}</td>
              <td><button data-del-esp="${u.id}:${m.id}:${e.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button></td>
            </tr>`)
            .join("");
          return `<h4 style="margin:14px 0 6px; font-size:.9rem;">${m.nome}</h4>
            <div class="table-wrap"><table class="data-table">
              <thead><tr><th>Especialidade</th><th>Progresso</th><th>Falta</th><th>Materiais</th><th></th></tr></thead>
              <tbody>${linhasEsp}</tbody>
            </table></div>`;
        })
        .join("");
      if (!linhasMembros) return "";
      return `<details class="month-acc" style="margin-bottom:10px;"><summary>${u.nome}</summary><div style="padding:10px 20px 18px;">${linhasMembros}</div></details>`;
    }).join("");

    wrap.innerHTML = blocos;
    vazio.style.display = total ? "none" : "block";

    wrap.querySelectorAll(".esp-status-select").forEach((sel) =>
      sel.addEventListener("change", () => {
        const [uid, mid, eid] = sel.dataset.esp.split(":");
        const novoStatus = sel.value;
        abrirModalMotivo({
          titulo: "Motivo da alteração",
          label: "Por que está mudando o progresso dessa especialidade? (obrigatório — a unidade recebe um aviso)",
          textoBotao: "Salvar",
          acao: async (motivo) => {
            await updateEspecialidade(uid, mid, eid, { status: novoStatus });
            await criarNotificacaoUnidade(uid, {
              tipo: "item_alterado",
              mensagem: "A liderança alterou o progresso de uma especialidade.",
              motivo,
            });
            mostrarToast("Especialidade atualizada.");
          },
        });
      })
    );
    wrap.querySelectorAll("[data-del-esp]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [uid, mid, eid] = btn.dataset.delEsp.split(":");
        abrirModalMotivo({
          titulo: "Excluir especialidade",
          label: "Motivo da exclusão (obrigatório — a unidade recebe um aviso)",
          textoBotao: "Confirmar exclusão",
          acao: async (motivo) => {
            await deleteEspecialidade(uid, mid, eid);
            await criarNotificacaoUnidade(uid, {
              tipo: "item_alterado",
              mensagem: "A liderança excluiu uma especialidade.",
              motivo,
            });
            mostrarToast("Especialidade excluída.");
          },
        });
      })
    );
  }

  /* ---------------- Lista geral de compras ---------------- */
  function renderCompras() {
    const wrap = document.getElementById("lista-compras-lideranca");
    const vazio = document.getElementById("compras-vazio");
    const linhas = [];

    RS_UNIDADES.forEach((u) => {
      (estado.membrosPorUnidade[u.id] || []).forEach((m) => {
        (fanOutMateriais.dados[m.id] || []).forEach((it) => {
          linhas.push({ unidade: u.nome, membro: m.nome, membroId: m.id, unidadeId: u.id, item: it });
        });
      });
    });

    vazio.style.display = linhas.length ? "none" : "block";
    wrap.innerHTML = linhas.length
      ? `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Item</th><th>Desbravador</th><th>Unidade</th><th>Especialidade</th><th>Status</th><th></th></tr></thead>
          <tbody>${linhas
            .map(
              ({ unidade, membro, membroId, unidadeId, item }) => `<tr class="${item.status === "comprado" ? "comprado" : ""}">
              <td>${item.nome}</td>
              <td>${membro}</td>
              <td>${unidade}</td>
              <td>${item.especialidade || "—"}</td>
              <td><span class="pill ${item.status === "comprado" ? "pill-open" : "pill-pending"}">${item.status === "comprado" ? "Comprado" : "Pendente"}</span></td>
              <td class="row-actions">
                <button data-toggle-compra="${unidadeId}:${membroId}:${item.id}:${item.status}">${item.status === "comprado" ? "Marcar pendente" : "Marcar comprado"}</button>
                <button data-del-material="${unidadeId}:${membroId}:${item.id}" style="color:#c1443a;">Excluir</button>
              </td>
            </tr>`
            )
            .join("")}</tbody>
        </table></div>`
      : "";

    wrap.querySelectorAll("[data-toggle-compra]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [uid, mid, iid, statusAtual] = btn.dataset.toggleCompra.split(":");
        await toggleMaterial(uid, mid, iid, statusAtual === "comprado" ? "pendente" : "comprado");
      })
    );
    wrap.querySelectorAll("[data-del-material]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [uid, mid, iid] = btn.dataset.delMaterial.split(":");
        abrirModalMotivo({
          titulo: "Excluir item da lista de compras",
          label: "Motivo da exclusão (obrigatório — a unidade recebe um aviso)",
          textoBotao: "Confirmar exclusão",
          acao: async (motivo) => {
            await deleteMaterial(uid, mid, iid);
            await criarNotificacaoUnidade(uid, {
              tipo: "item_alterado",
              mensagem: "A liderança excluiu um item da lista de compras.",
              motivo,
            });
            mostrarToast("Item excluído.");
          },
        });
      })
    );
  }

  /* ---------------- Planejamento das Unidades ---------------- */
  RS_UNIDADES.forEach((u) => {
    watchPlanejamentos(u.id, (lista) => {
      estado.planejamentosPorUnidade[u.id] = lista;
      renderPlanejamentoLideranca();
      renderStats();
    });
  });

  /* ---------------- Identidade das unidades (logo + grito de guerra + cor) ----------------
     Só a liderança edita — a própria unidade só lê (ver painel-unidade.js). */
  document.getElementById("lista-identidade-unidades").innerHTML = RS_UNIDADES
    .map(
      (u) => `<div class="card" style="margin-bottom:14px;" data-identidade-card="${u.id}">
        <h3 style="margin:0 0 10px;">${u.nome}</h3>
        <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
          <img class="identidade-logo-preview" src="" alt="Logo ${u.nome}" style="width:64px; height:64px; border-radius:50%; object-fit:cover; background:var(--bg); display:none;">
          <div class="field" style="flex:1; min-width:200px; margin:0;"><label>Logo</label><input type="file" class="identidade-logo-input" accept="image/*"></div>
        </div>
        <div class="field"><label>Grito de guerra</label><input type="text" class="identidade-grito-input" placeholder="Ex.: Unidade ${u.nome}, sempre alerta!"></div>
        <div class="field">
          <label>Cor da unidade</label>
          <div class="cores-paleta">
            ${RS_CORES_UNIDADE.map((c) => `<button type="button" class="cor-swatch" data-cor="${c}" style="background:${c};" aria-label="Cor ${c}"></button>`).join("")}
            <input type="color" class="identidade-cor-input" title="Escolher outra cor">
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-sm" data-salvar-identidade="${u.id}">Salvar</button>
      </div>`
    )
    .join("");

  document.querySelectorAll("[data-identidade-card]").forEach((card) => {
    const corInput = card.querySelector(".identidade-cor-input");
    card.querySelectorAll(".cor-swatch").forEach((sw) =>
      sw.addEventListener("click", () => {
        card.querySelectorAll(".cor-swatch").forEach((s) => s.classList.remove("selecionada"));
        sw.classList.add("selecionada");
        corInput.value = sw.dataset.cor;
      })
    );
  });

  document.querySelectorAll("[data-salvar-identidade]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const unidadeId = btn.dataset.salvarIdentidade;
      const card = btn.closest("[data-identidade-card]");
      btn.disabled = true;
      try {
        const arquivo = card.querySelector(".identidade-logo-input").files[0];
        let logoUrl = (estado.identidadePorUnidade[unidadeId] || {}).logoUrl || "";
        if (arquivo) {
          const enviado = await enviarImagemCloudinary(arquivo);
          logoUrl = enviado.url;
        }
        const gritoDeGuerra = card.querySelector(".identidade-grito-input").value.trim();
        const cor = card.querySelector(".identidade-cor-input").value;
        await salvarIdentidadeUnidade(unidadeId, { logoUrl, gritoDeGuerra, cor });
        card.querySelector(".identidade-logo-input").value = "";
        mostrarToast(`Identidade de ${nomeDaUnidade(unidadeId)} atualizada.`);
      } catch (err) {
        mostrarToast(err.message || "Não foi possível salvar.");
      }
      btn.disabled = false;
    })
  );

  function renderIdentidadeUnidades() {
    RS_UNIDADES.forEach((u) => {
      const card = document.querySelector(`[data-identidade-card="${u.id}"]`);
      if (!card) return;
      const identidade = estado.identidadePorUnidade[u.id] || {};
      const preview = card.querySelector(".identidade-logo-preview");
      if (identidade.logoUrl) {
        preview.src = identidade.logoUrl;
        preview.style.display = "block";
      } else {
        preview.style.display = "none";
      }
      const gritoInput = card.querySelector(".identidade-grito-input");
      if (document.activeElement !== gritoInput) gritoInput.value = identidade.gritoDeGuerra || "";
      card.querySelector(".identidade-cor-input").value = identidade.cor || "#000000";
      card.querySelectorAll(".cor-swatch").forEach((sw) =>
        sw.classList.toggle("selecionada", sw.dataset.cor === identidade.cor)
      );
    });
  }

  RS_UNIDADES.forEach((u) => {
    watchIdentidadeUnidade(u.id, (identidade) => {
      estado.identidadePorUnidade[u.id] = identidade;
      renderDesbravadores();
      renderIdentidadeUnidades();
    });
  });

  /* ---------------- Conselheiros (só leitura pra liderança) ---------------- */
  RS_UNIDADES.forEach((u) => {
    watchConselheiros(u.id, (conselheiros) => {
      estado.conselheirosPorUnidade[u.id] = conselheiros;
      renderDesbravadores();
    });
  });

  /* ---------------- Presença (só leitura pra liderança) ---------------- */
  RS_UNIDADES.forEach((u) => {
    watchPresencas(u.id, (presencas) => {
      estado.presencasPorUnidade[u.id] = presencas;
      renderDesbravadores();
    });
  });

  /* ---------------- Placar do Acampamento ---------------- */
  watchPontuacaoAcampamento((lancamentos) => {
    estado.pontuacao = lancamentos;
    renderPlacar();
  });

  document.getElementById("pt-unidade").innerHTML =
    `<option value="">Selecione</option>` + RS_UNIDADES.map((u) => `<option value="${u.id}">${u.nome}</option>`).join("");

  function renderPlacar() {
    const ranking = document.getElementById("placar-ranking");
    const historico = document.getElementById("placar-historico");

    const totais = RS_UNIDADES.map((u) => {
      const doUnidade = estado.pontuacao.filter((l) => l.unidadeId === u.id);
      const total = doUnidade.reduce((soma, l) => soma + (l.tipo === "perdeu" ? -l.pontos : l.pontos), 0);
      return { ...u, total };
    }).sort((a, b) => b.total - a.total);

    ranking.innerHTML = totais
      .map(
        (u, i) => `<div class="placar-linha">
          <span class="placar-pos">${i + 1}º</span>
          <span class="placar-nome">${u.nome}</span>
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
              <button data-del-pontuacao="${l.id}" style="margin-left:auto; background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
            </div>`;
          })
          .join("")
      : `<div class="empty-state">Nenhum lançamento ainda.</div>`;

    historico.querySelectorAll("[data-del-pontuacao]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este lançamento?")) return;
        await deletePontuacaoAcampamento(btn.dataset.delPontuacao);
        mostrarToast("Lançamento removido.");
      })
    );
  }

  document.getElementById("form-placar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const unidadeId = document.getElementById("pt-unidade").value;
    const tipo = document.getElementById("pt-tipo").value;
    const pontos = Number(document.getElementById("pt-pontos").value);
    const motivo = document.getElementById("pt-motivo").value.trim();
    if (!unidadeId || !pontos) return;
    if (tipo === "perdeu" && !motivo) {
      mostrarToast("Escreva o motivo da perda de pontos.");
      return;
    }
    await addPontuacaoAcampamento(unidadeId, tipo, pontos, motivo);
    e.target.reset();
    document.getElementById("pt-tipo").value = "ganhou";
    mostrarToast("Placar atualizado.");
  });

  document.getElementById("btn-zerar-placar").addEventListener("click", async () => {
    if (!estado.pontuacao.length) return;
    if (!confirm("Zerar o placar inteiro? Isso apaga todos os lançamentos — ideal pra começar um acampamento novo.")) return;
    await Promise.all(estado.pontuacao.map((l) => deletePontuacaoAcampamento(l.id)));
    mostrarToast("Placar zerado.");
  });

  /* ---------------- Pedidos de troca de senha ---------------- */
  RS_UNIDADES.forEach((u) => {
    watchPedidoSenha(u.id, (pedido) => {
      estado.pedidosSenhaPorUnidade[u.id] = pedido;
      renderPedidosSenha();
    });
  });

  function renderPedidosSenha() {
    const wrap = document.getElementById("lista-pedidos-senha");
    const vazio = document.getElementById("pedidos-senha-vazio");
    const pendentes = RS_UNIDADES
      .map((u) => ({ unidade: u, pedido: estado.pedidosSenhaPorUnidade[u.id] }))
      .filter(({ pedido }) => pedido && pedido.status === "pendente");

    vazio.style.display = pendentes.length ? "none" : "block";
    wrap.innerHTML = pendentes
      .map(
        ({ unidade }) => `
      <div class="card" style="margin-bottom:14px;">
        <h3 style="margin:0;">Unidade ${unidade.nome}</h3>
        <p class="muted" style="margin:6px 0 0;">Pediu pra trocar a senha de login.</p>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <button type="button" class="btn btn-green btn-sm" data-aprovar-senha="${unidade.id}">✅ Aprovar</button>
          <button type="button" class="btn btn-outline btn-sm" data-recusar-senha="${unidade.id}" style="border-color:#c1443a; color:#c1443a;">❌ Recusar</button>
        </div>
      </div>`
      )
      .join("");

    wrap.querySelectorAll("[data-aprovar-senha]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        await aprovarTrocaSenha(btn.dataset.aprovarSenha);
        mostrarToast("Troca de senha aprovada — vale assim que a unidade entrar de novo.");
      })
    );
    wrap.querySelectorAll("[data-recusar-senha]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const uid = btn.dataset.recusarSenha;
        abrirModalMotivo({
          titulo: "Recusar troca de senha",
          label: "Motivo da recusa (obrigatório)",
          textoBotao: "Confirmar recusa",
          acao: async (motivo) => {
            await recusarTrocaSenha(uid, motivo);
            mostrarToast("Troca de senha recusada.");
          },
        });
      })
    );
  }

  document.getElementById("filtro-unidade").innerHTML =
    `<option value="">Todas as unidades</option>` + RS_UNIDADES.map((u) => `<option value="${u.id}">${u.nome}</option>`).join("");

  ["filtro-unidade", "filtro-status", "filtro-data"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const chave = id.replace("filtro-", "");
      filtros[chave] = e.target.value;
      renderPlanejamentoLideranca();
    });
  });
  document.getElementById("btn-limpar-filtros").addEventListener("click", () => {
    filtros.unidade = ""; filtros.status = ""; filtros.data = "";
    document.getElementById("filtro-unidade").value = "";
    document.getElementById("filtro-status").value = "";
    document.getElementById("filtro-data").value = "";
    renderPlanejamentoLideranca();
  });

  function renderPlanejamentoLideranca() {
    const todos = RS_UNIDADES.flatMap((u) =>
      (estado.planejamentosPorUnidade[u.id] || []).map((p) => ({ ...p, unidadeId: u.id, unidadeNome: u.nome }))
    );
    const filtrados = todos.filter((p) =>
      (!filtros.unidade || p.unidadeId === filtros.unidade) &&
      (!filtros.status || p.status === filtros.status) &&
      (!filtros.data || p.data === filtros.data)
    );
    filtrados.sort((a, b) => (a.data || "").localeCompare(b.data || ""));

    const pendentesTotal = todos.filter((p) => p.status === "pendente").length;
    const badge = document.getElementById("badge-pendentes");
    badge.textContent = pendentesTotal;
    badge.style.display = pendentesTotal ? "inline-block" : "none";

    const wrap = document.getElementById("lista-planejamento-lideranca");
    const vazio = document.getElementById("planejamento-lideranca-vazio");
    vazio.style.display = filtrados.length ? "none" : "block";

    wrap.innerHTML = filtrados
      .map((p) => {
        const pillClasse = p.status === "aprovado" ? "pill-open" : p.status === "recusado" ? "pill-closed" : "pill-pending";
        return `
        <div class="card" style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
            <h3 style="margin:0;">${p.titulo} <span class="muted" style="font-weight:600; font-size:.8rem;">— ${p.unidadeNome}</span></h3>
            <span class="pill ${pillClasse}">${RS_PLANEJAMENTO_STATUS[p.status] || p.status}</span>
          </div>
          <p class="muted" style="margin:6px 0 0;">${fmtDataBr(p.data)} às ${p.horario || "—"} · ${p.local || "—"}</p>
          <p style="margin:8px 0 0;"><strong>Objetivo:</strong> ${p.objetivo || "—"}</p>
          <p style="margin:6px 0 0;">${p.descricao || ""}</p>
          ${p.observacoes ? `<p class="muted" style="margin:6px 0 0;"><strong>Observações:</strong> ${p.observacoes}</p>` : ""}
          ${p.status === "recusado" ? `<div class="alert alert-error show" style="margin-top:10px;"><strong>Motivo da recusa:</strong> ${p.motivoRecusa}</div>` : ""}
          <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
            ${p.status === "pendente" ? `
            <button type="button" class="btn btn-green btn-sm" data-aprovar="${p.unidadeId}:${p.id}">✅ Aprovar</button>
            <button type="button" class="btn btn-outline btn-sm" data-recusar="${p.unidadeId}:${p.id}" style="border-color:#c1443a; color:#c1443a;">❌ Recusar</button>` : ""}
            <button type="button" class="btn btn-outline btn-sm" data-excluir-plano="${p.unidadeId}:${p.id}" style="border-color:#c1443a; color:#c1443a; margin-left:auto;">🗑️ Excluir</button>
          </div>
        </div>`;
      })
      .join("");

    wrap.querySelectorAll("[data-aprovar]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [uid, pid] = btn.dataset.aprovar.split(":");
        const p = (estado.planejamentosPorUnidade[uid] || []).find((x) => x.id === pid);
        await aprovarPlanejamento(uid, pid, p ? p.titulo : "");
        mostrarToast("Planejamento aprovado.");
      })
    );
    wrap.querySelectorAll("[data-recusar]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [uid, pid] = btn.dataset.recusar.split(":");
        const p = (estado.planejamentosPorUnidade[uid] || []).find((x) => x.id === pid);
        abrirModalMotivo({
          titulo: "Recusar proposta",
          label: "Motivo da recusa (obrigatório)",
          textoBotao: "Confirmar recusa",
          acao: async (motivo) => {
            await recusarPlanejamento(uid, pid, p ? p.titulo : "", motivo);
            mostrarToast("Planejamento recusado.");
          },
        });
      })
    );
    wrap.querySelectorAll("[data-excluir-plano]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [uid, pid] = btn.dataset.excluirPlano.split(":");
        const p = (estado.planejamentosPorUnidade[uid] || []).find((x) => x.id === pid);
        abrirModalMotivo({
          titulo: "Excluir planejamento",
          label: "Motivo da exclusão (obrigatório — a unidade recebe um aviso)",
          textoBotao: "Confirmar exclusão",
          acao: async (motivo) => {
            await deletePlanejamento(uid, pid, p ? p.titulo : "", motivo);
            mostrarToast("Planejamento excluído.");
          },
        });
      })
    );
  }

  /* Modal genérico de "motivo obrigatório" — reaproveitado por
     recusar planejamento, excluir planejamento e (mais abaixo)
     qualquer edição/exclusão da liderança em algo de uma unidade. */
  const modalRecusa = document.getElementById("modal-recusa");
  let motivoAcao = null;
  function abrirModalMotivo({ titulo, label, textoBotao, acao }) {
    document.getElementById("modal-recusa-titulo").textContent = titulo;
    document.getElementById("modal-recusa-label").textContent = label;
    document.getElementById("modal-recusa-confirmar").textContent = textoBotao;
    document.getElementById("recusa-motivo").value = "";
    motivoAcao = acao;
    modalRecusa.classList.add("show");
  }
  document.getElementById("btn-cancelar-recusa").addEventListener("click", () => modalRecusa.classList.remove("show"));
  document.getElementById("form-recusa").addEventListener("submit", async (e) => {
    e.preventDefault();
    const motivo = document.getElementById("recusa-motivo").value.trim();
    if (!motivo || !motivoAcao) return;
    await motivoAcao(motivo);
    modalRecusa.classList.remove("show");
  });

  /* ---------------- Notificações ---------------- */
  const notifDropdown = document.getElementById("notif-dropdown");
  watchNotificacoesLideranca((lista) => { estado.notificacoes = lista; renderNotificacoes(); });

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
        <span>📋</span>
        <div><p>${n.mensagem}</p></div>
        <button type="button" class="notif-del" data-del-notif="${n.id}" aria-label="Remover notificação">✕</button>
      </div>`)
      .join("");
    listaEl.querySelectorAll("[data-del-notif]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNotificacaoLideranca(btn.dataset.delNotif);
      })
    );
  }

  document.getElementById("btn-notif").addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
    if (notifDropdown.classList.contains("show")) {
      const idsNaoLidas = estado.notificacoes.filter((n) => !n.lida).map((n) => n.id);
      if (idsNaoLidas.length) marcarNotificacoesLiderancaLidas(idsNaoLidas);
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".notif-wrap")) notifDropdown.classList.remove("show");
  });

  /* ---------------- Planejamento do Clube (calendário) ---------------- */
  document.getElementById("ev-categoria").innerHTML =
    RS_PLANEJAMENTO_CLUBE_CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join("");

  criarCalendarioClube({
    aoAtualizarLista: (lista) => { estado.eventosClube = lista; },
    aoClicarEvento: (ev) => abrirDetalheEvento(ev.id),
  });

  const modalEvento = document.getElementById("modal-evento");
  const modalDetalhe = document.getElementById("modal-evento-detalhe");
  const formEvento = document.getElementById("form-evento");
  let eventoEmEdicao = null;

  function abrirModalEvento(eventoId) {
    eventoEmEdicao = eventoId || null;
    const titulo = document.getElementById("modal-evento-titulo");
    document.getElementById("btn-excluir-evento").style.display = eventoId ? "block" : "none";
    if (eventoId) {
      const ev = estado.eventosClube.find((x) => x.id === eventoId);
      titulo.textContent = "Editar evento";
      document.getElementById("ev-nome").value = ev.nome || "";
      document.getElementById("ev-data").value = ev.data || "";
      document.getElementById("ev-data-fim").value = ev.dataFim || "";
      document.getElementById("ev-horario").value = ev.horario || "";
      document.getElementById("ev-categoria").value = ev.categoria || RS_PLANEJAMENTO_CLUBE_CATEGORIAS[0];
      document.getElementById("ev-descricao").value = ev.descricao || "";
      document.getElementById("ev-observacoes").value = ev.observacoes || "";
    } else {
      titulo.textContent = "Novo evento";
      formEvento.reset();
    }
    modalDetalhe.classList.remove("show");
    modalEvento.classList.add("show");
  }

  function abrirDetalheEvento(eventoId) {
    const ev = estado.eventosClube.find((x) => x.id === eventoId);
    if (!ev) return;
    document.getElementById("detalhe-nome").textContent = ev.nome;
    document.getElementById("detalhe-data").textContent =
      `${fmtDataBr(ev.data)}${ev.dataFim && ev.dataFim !== ev.data ? " a " + fmtDataBr(ev.dataFim) : ""}${ev.horario ? " · " + ev.horario : ""}`;
    document.getElementById("detalhe-categoria").textContent = ev.categoria;
    document.getElementById("detalhe-descricao").textContent = ev.descricao || "";
    document.getElementById("detalhe-observacoes").textContent = ev.observacoes ? "Observações: " + ev.observacoes : "";
    document.getElementById("btn-editar-evento").onclick = () => abrirModalEvento(ev.id);
    modalDetalhe.classList.add("show");
  }

  document.getElementById("btn-novo-evento").addEventListener("click", () => abrirModalEvento(null));
  document.getElementById("btn-cancelar-evento").addEventListener("click", () => modalEvento.classList.remove("show"));
  document.getElementById("btn-fechar-detalhe").addEventListener("click", () => modalDetalhe.classList.remove("show"));
  document.getElementById("btn-excluir-evento").addEventListener("click", async () => {
    if (!eventoEmEdicao || !confirm("Excluir este evento?")) return;
    await deleteEventoClube(eventoEmEdicao);
    modalEvento.classList.remove("show");
    mostrarToast("Evento excluído.");
  });
  formEvento.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      nome: document.getElementById("ev-nome").value.trim(),
      data: document.getElementById("ev-data").value,
      dataFim: document.getElementById("ev-data-fim").value || "",
      horario: document.getElementById("ev-horario").value,
      categoria: document.getElementById("ev-categoria").value,
      descricao: document.getElementById("ev-descricao").value.trim(),
      observacoes: document.getElementById("ev-observacoes").value.trim(),
    };
    if (eventoEmEdicao) {
      await updateEventoClube(eventoEmEdicao, dados);
      mostrarToast("Evento atualizado.");
    } else {
      await addEventoClube(dados);
      mostrarToast("Evento adicionado.");
    }
    modalEvento.classList.remove("show");
  });

  document.getElementById("btn-seed-planejamento").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.disabled = true;
    const gravou = await seedPlanejamentoClube(RS_PLANEJAMENTO_CLUBE_SEED);
    mostrarToast(gravou ? "Planejamento padrão carregado." : "O calendário já tinha eventos — nada foi duplicado.");
    btn.disabled = false;
  });

  /* ---------------- Mídia (pastas com link do Google Drive) ---------------- */
  watchMidia((pastas) => {
    estado.midia = pastas;
    renderMidia();
    renderStats();
  });

  function renderMidia() {
    const wrap = document.getElementById("lista-midia");
    const vazio = document.getElementById("midia-vazio");
    vazio.style.display = estado.midia.length ? "none" : "block";

    wrap.innerHTML = estado.midia
      .map(
        (p) => `<div class="pasta-bloco">
          <div class="pasta-cabecalho">
            <h3>📁 ${p.nome}</h3>
            <div style="display:flex; gap:8px;">
              <a class="btn btn-outline btn-sm" href="${p.link}" target="_blank" rel="noopener">Abrir no Drive ↗</a>
              <button type="button" class="danger" data-del-pasta="${p.id}">Excluir</button>
            </div>
          </div>
        </div>`
      )
      .join("");

    wrap.querySelectorAll("[data-del-pasta]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir esta pasta?")) return;
        await deletePastaMidia(btn.dataset.delPasta);
        mostrarToast("Pasta removida.");
      })
    );
  }

  const modalPasta = document.getElementById("modal-pasta");
  document.getElementById("btn-nova-pasta").addEventListener("click", () => modalPasta.classList.add("show"));
  document.getElementById("btn-cancelar-pasta").addEventListener("click", () => modalPasta.classList.remove("show"));
  document.getElementById("form-pasta").addEventListener("submit", async (e) => {
    e.preventDefault();
    await addPastaMidia(
      document.getElementById("pa-nome").value.trim(),
      document.getElementById("pa-link").value.trim()
    );
    modalPasta.classList.remove("show");
    e.target.reset();
    mostrarToast("Pasta publicada!");
  });

  /* ---------------- Campori ---------------- */
  watchCampori((campori) => {
    const input = document.getElementById("campori-data");
    if (document.activeElement !== input) input.value = campori.data || RS_CAMPORI_DATA_PADRAO;
  });
  document.getElementById("form-campori").addEventListener("submit", async (e) => {
    e.preventDefault();
    await setCamporiData(document.getElementById("campori-data").value);
    mostrarToast("Data do Campori atualizada.");
  });

  /* ---------------- Estatísticas ---------------- */
  function renderStats() {
    const totalMembros = RS_UNIDADES.reduce((acc, u) => acc + (estado.membrosPorUnidade[u.id] || []).length, 0);
    const ativos = estado.lavajato.filter((r) => !r.cancelado).length;

    document.getElementById("s-unidades").textContent = RS_UNIDADES.length;
    document.getElementById("s-lideres").textContent = RS_UNIDADES.length + 1;
    document.getElementById("s-membros").textContent = totalMembros;
    document.getElementById("s-lavajato-ativos").textContent = ativos;
    document.getElementById("s-midia").textContent = estado.midia.length;

    const todosPlanejamentos = RS_UNIDADES.flatMap((u) => estado.planejamentosPorUnidade[u.id] || []);
    document.getElementById("s-plan-pendentes").textContent = todosPlanejamentos.filter((p) => p.status === "pendente").length;
    document.getElementById("s-plan-aprovados").textContent = todosPlanejamentos.filter((p) => p.status === "aprovado").length;
    document.getElementById("s-plan-recusados").textContent = todosPlanejamentos.filter((p) => p.status === "recusado").length;

    const todasEspecialidades = Object.values(fanOutEspecialidades.dados).flat();
    document.getElementById("s-esp-andamento").textContent = todasEspecialidades.filter((e) => e.status === "andamento").length;
    document.getElementById("s-esp-concluidas").textContent = todasEspecialidades.filter((e) => e.status === "concluida").length;

    const todosMateriais = Object.values(fanOutMateriais.dados).flat();
    document.getElementById("s-materiais-pendentes").textContent = todosMateriais.filter((m) => m.status !== "comprado").length;

    const todosMembros = RS_UNIDADES.flatMap((u) => estado.membrosPorUnidade[u.id] || []);
    const semEspecialidade = todosMembros.filter((m) => !(fanOutEspecialidades.dados[m.id] || []).length).length;
    document.getElementById("s-sem-especialidade").textContent = semEspecialidade;

    const cadastroIncompleto = todosMembros.filter((m) => !m.responsavel || !m.telefone).length;
    document.getElementById("s-cadastro-incompleto").textContent = cadastroIncompleto;

    let responsaveisSemTelefone = 0;
    todosMembros.forEach((m) => {
      if (m.responsavel && !m.telefone) responsaveisSemTelefone++;
      if (m.responsavel2Nome && !m.responsavel2Telefone) responsaveisSemTelefone++;
    });
    document.getElementById("s-resp-sem-telefone").textContent = responsaveisSemTelefone;
  }

  /* ---------------- Backup ---------------- */
  document.getElementById("btn-exportar-tudo").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Gerando backup...";
    try {
      await exportarBackup();
    } finally {
      btn.disabled = false;
      btn.textContent = "📦 Exportar backup completo";
    }
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
