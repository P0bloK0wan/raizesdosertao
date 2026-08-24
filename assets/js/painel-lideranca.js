/* =========================================================
   Painel da Liderança
   ========================================================= */

import { RS_UNIDADES, RS_CAMPORI_DATA_PADRAO } from "./data.js";
import { exigirSessao, logout, trocarSenha } from "./auth.js";
import {
  watchLavaJato, deleteRegistroLavaJato,
  watchMembros, deleteMembro,
  watchRegistrosMembro,
  watchMidia, addPastaMidia, deletePastaMidia,
  watchCampori, setCamporiData,
  exportarBackup,
} from "./store.js";
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

function iniciarPainel() {
  const estado = {
    lavajato: [],
    membrosPorUnidade: Object.fromEntries(RS_UNIDADES.map((u) => [u.id, []])),
    registrosPorMembro: {},
    midia: [],
  };
  const idsJaNotificados = new Set();
  let primeiraLeitura = true;
  const unsubsRegistros = new Map(); // membroId -> unsub
  const unidadesAbertas = new Set();
  const membrosAbertos = new Set();

  /* ---------------- Lava Jato ---------------- */
  watchLavaJato((lista) => {
    // detecta cancelamentos novos pra notificar a liderança
    if (!primeiraLeitura) {
      lista.forEach((r) => {
        if (r.cancelado && !idsJaNotificados.has(r.id) && !estado.lavajato.some((old) => old.id === r.id && old.cancelado)) {
          notificarCancelamento(r);
        }
      });
    }
    lista.forEach((r) => { if (r.cancelado) idsJaNotificados.add(r.id); });
    primeiraLeitura = false;

    estado.lavajato = lista;
    renderLavaJato();
    renderStats();
  });

  function notificarCancelamento(registro) {
    mostrarToast(`⚠️ ${registro.nome} cancelou o atendimento do Lava Jato.`);
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        new Notification("Cancelamento no Lava Jato", { body: `${registro.nome} (${registro.placa}) cancelou o atendimento.` });
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

    estado.lavajato.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.nome}</td>
        <td>${r.telefone}</td>
        <td>${r.placa}</td>
        <td>${r.modelo}</td>
        <td>${r.cor}</td>
        <td><span class="pill ${r.cancelado ? "pill-closed" : "pill-open"}">${r.cancelado ? "Cancelado" : "Ativo"}</span></td>
        <td class="row-actions"><button class="danger" data-del="${r.id}">Excluir</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este cadastro do Lava Jato?")) return;
        await deleteRegistroLavaJato(btn.dataset.del);
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

  /* ---------------- Unidades / desbravadores / requisitos ---------------- */
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
            .map((r) => `<li><span class="rg-criterio">${r.criterio}</span><span class="rg-data">${fmtDataBr(r.data)}</span></li>`)
            .join("");
          return `
          <details class="month-acc" style="margin-top:8px;" data-membro-acc="${m.id}"${membrosAbertos.has(m.id) ? " open" : ""}>
            <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${m.classe || "sem classe"} · ${regs.length} registro(s))</span>
              <button class="danger" data-del-membro="${u.id}:${m.id}" style="margin-left:auto;">Excluir</button>
            </summary>
            <div style="padding:14px 20px 18px;">
              <p class="muted" style="margin:0 0 8px;">Nascimento: ${m.nascimento || "—"} · Responsável: ${m.responsavel || "—"} · Telefone: ${m.telefone || "—"}</p>
              <ul class="registro-list">${linhasRegs || "<li class='muted' style='border:none;'>Nenhum registro lançado ainda.</li>"}</ul>
            </div>
          </details>`;
        })
        .join("");
      det.innerHTML = `
        <summary>${u.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${membros.length} desbravador(es) · ${totalRegistros} registro(s) de requisitos)</span></summary>
        <div style="padding:14px 20px 18px;">
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
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const [uid, mid] = btn.dataset.delMembro.split(":");
        if (!confirm("Excluir este desbravador? Todo o histórico de requisitos dele também será perdido.")) return;
        await deleteMembro(uid, mid);
        mostrarToast("Desbravador removido.");
      })
    );
  }

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

      renderDesbravadores();
      renderStats();
    });
  });

  /* ---------------- Mídia ---------------- */
  watchMidia((pastas) => { estado.midia = pastas; renderMidia(); renderStats(); });

  function renderMidia() {
    const tbody = document.getElementById("tbody-midia");
    const vazio = document.getElementById("midia-vazio");
    tbody.innerHTML = estado.midia
      .map(
        (p) => `<tr>
          <td>📁 ${p.nome}</td>
          <td><a href="${p.link}" target="_blank" rel="noopener">Abrir ↗</a></td>
          <td class="row-actions"><button class="danger" data-del-pasta="${p.id}">Excluir</button></td>
        </tr>`
      )
      .join("");
    vazio.style.display = estado.midia.length ? "none" : "block";

    tbody.querySelectorAll("[data-del-pasta]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir esta pasta da página pública de Mídia?")) return;
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
    await addPastaMidia(document.getElementById("pa-nome").value.trim(), document.getElementById("pa-link").value.trim());
    modalPasta.classList.remove("show");
    e.target.reset();
    mostrarToast("Link salvo com sucesso! A pasta já está na página pública de Mídia.");
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
    const cancelados = estado.lavajato.filter((r) => r.cancelado).length;

    document.getElementById("s-membros").textContent = totalMembros;
    document.getElementById("s-lavajato-ativos").textContent = ativos;
    document.getElementById("s-lavajato-cancelados").textContent = cancelados;
    document.getElementById("s-midia").textContent = estado.midia.length;
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
