/* =========================================================
   Painel da Unidade
   ========================================================= */

(function () {
  const sessao = RS_AUTH.exigirSessao("unidade");
  if (!sessao) return;

  const unidadeId = sessao.unidadeId;
  const unidade = RS_UNIDADES.find((u) => u.id === unidadeId);

  document.getElementById("quem").textContent = sessao.nome;
  document.getElementById("unidade-nome").textContent = "Unidade " + unidade.nome;
  document.getElementById("mobile-title").textContent = "Unidade " + unidade.nome;
  document.getElementById("btn-sair").addEventListener("click", RS_AUTH.logout);

  function uid() { return "m" + Date.now() + Math.floor(Math.random() * 1000); }

  /* ---------------- Membros ---------------- */
  function renderMembros() {
    const membros = RS.getMembros(unidadeId);
    const tbody = document.getElementById("tbody-membros");
    const vazio = document.getElementById("membros-vazio");
    tbody.innerHTML = "";
    vazio.style.display = membros.length ? "none" : "block";

    membros.forEach((m) => {
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
      btn.addEventListener("click", () => {
        if (!confirm("Excluir este desbravador?")) return;
        RS.setMembros(unidadeId, RS.getMembros(unidadeId).filter((m) => m.id !== btn.dataset.del));
        renderTudo();
        mostrarToast("Desbravador removido.");
      })
    );

    document.getElementById("s-membros").textContent = membros.length;
  }

  const modalMembro = document.getElementById("modal-membro");
  document.getElementById("btn-novo-membro").addEventListener("click", () => modalMembro.classList.add("show"));
  document.getElementById("btn-cancelar-membro").addEventListener("click", () => modalMembro.classList.remove("show"));
  document.getElementById("form-membro").addEventListener("submit", (e) => {
    e.preventDefault();
    const membros = RS.getMembros(unidadeId);
    membros.push({
      id: uid(),
      nome: document.getElementById("m-nome").value.trim(),
      nascimento: document.getElementById("m-nascimento").value,
      classe: document.getElementById("m-classe").value,
      responsavel: document.getElementById("m-responsavel").value.trim(),
      telefone: document.getElementById("m-telefone").value.trim(),
    });
    RS.setMembros(unidadeId, membros);
    modalMembro.classList.remove("show");
    e.target.reset();
    renderTudo();
    mostrarToast("Desbravador cadastrado.");
  });

  /* ---------------- Avaliação semanal ---------------- */
  function mediaAvaliacao(a) {
    const soma = RS_CRITERIOS.reduce((acc, c) => acc + Number(a[c.id] || 0), 0);
    return (soma / RS_CRITERIOS.length).toFixed(1);
  }

  function renderAvaliacoes() {
    const membros = RS.getMembros(unidadeId);
    const nomePorId = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
    const avaliacoes = RS.getAvaliacoes(unidadeId).slice().sort((a, b) => (a.data < b.data ? 1 : -1));
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
      btn.addEventListener("click", () => {
        if (!confirm("Excluir esta avaliação?")) return;
        RS.setAvaliacoes(unidadeId, RS.getAvaliacoes(unidadeId).filter((a) => a.id !== btn.dataset.delAv));
        renderTudo();
        mostrarToast("Avaliação removida.");
      })
    );
  }

  const modalAvaliacao = document.getElementById("modal-avaliacao");
  document.getElementById("btn-nova-avaliacao").addEventListener("click", () => {
    const membros = RS.getMembros(unidadeId);
    const select = document.getElementById("av-membro");
    if (!membros.length) {
      select.innerHTML = `<option disabled>Cadastre desbravadores primeiro</option>`;
    } else {
      select.innerHTML = membros.map((m) => `<option value="${m.id}">${m.nome}</option>`).join("");
    }
    document.getElementById("av-data").value = new Date().toISOString().slice(0, 10);
    modalAvaliacao.classList.add("show");
  });
  document.getElementById("btn-cancelar-avaliacao").addEventListener("click", () => modalAvaliacao.classList.remove("show"));
  document.getElementById("form-avaliacao").addEventListener("submit", (e) => {
    e.preventDefault();
    const membroId = document.getElementById("av-membro").value;
    if (!membroId) return;
    const avaliacoes = RS.getAvaliacoes(unidadeId);
    avaliacoes.push({
      id: uid(),
      membroId,
      data: document.getElementById("av-data").value,
      pontualidade: Number(document.getElementById("av-pontualidade").value),
      biblia: Number(document.getElementById("av-biblia").value),
      uniforme: Number(document.getElementById("av-uniforme").value),
      participacao: Number(document.getElementById("av-participacao").value),
      comportamento: Number(document.getElementById("av-comportamento").value),
    });
    RS.setAvaliacoes(unidadeId, avaliacoes);
    modalAvaliacao.classList.remove("show");
    renderTudo();
    mostrarToast("Avaliação salva.");
  });

  /* ---------------- Vagas ---------------- */
  let vagaAlvo = null;
  function renderVagas() {
    const vagas = RS.getVagas();
    const tbody = document.getElementById("tbody-vagas");
    tbody.innerHTML = "";

    vagas.forEach((v) => {
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
      btn.addEventListener("click", () => {
        if (!confirm("Liberar esta vaga para outra unidade?")) return;
        const lista = RS.getVagas();
        const v = lista.find((x) => x.id === btn.dataset.liberar);
        if (v) { v.unidadeId = null; v.membros = []; v.responsavel = ""; }
        RS.setVagas(lista);
        renderTudo();
        mostrarToast("Vaga liberada.");
      })
    );

    const fechadasPelaUnidade = vagas.filter((v) => v.unidadeId === unidadeId).length;
    document.getElementById("s-vagas-fechadas").textContent = fechadasPelaUnidade;
  }

  const modalFechar = document.getElementById("modal-fechar-vaga");
  function abrirModalFechar(vagaId) {
    vagaAlvo = vagaId;
    const membros = RS.getMembros(unidadeId);
    const select = document.getElementById("fv-membros");
    if (!membros.length) {
      select.innerHTML = `<option disabled>Cadastre desbravadores primeiro</option>`;
    } else {
      select.innerHTML = membros.map((m) => `<option value="${m.nome}">${m.nome}</option>`).join("");
    }
    document.getElementById("fv-responsavel").value = "";
    modalFechar.classList.add("show");
  }
  document.getElementById("btn-cancelar-fechar").addEventListener("click", () => modalFechar.classList.remove("show"));
  document.getElementById("form-fechar-vaga").addEventListener("submit", (e) => {
    e.preventDefault();
    const selecionados = Array.from(document.getElementById("fv-membros").selectedOptions).map((o) => o.value);
    const lista = RS.getVagas();
    const v = lista.find((x) => x.id === vagaAlvo);
    if (v) {
      v.unidadeId = unidadeId;
      v.responsavel = document.getElementById("fv-responsavel").value.trim();
      v.membros = selecionados;
    }
    RS.setVagas(lista);
    modalFechar.classList.remove("show");
    renderTudo();
    mostrarToast("Vaga fechada para sua unidade!");
  });

  /* ---------------- Exportar ---------------- */
  document.getElementById("btn-exportar").addEventListener("click", () => RS.exportarUnidade(unidadeId));

  /* ---------------- Trocar senha ---------------- */
  document.getElementById("form-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("senha-erro");
    const ok = document.getElementById("senha-ok");
    erro.classList.remove("show"); ok.classList.remove("show");
    try {
      await RS_AUTH.trocarSenha(sessao.usuario, document.getElementById("senha-atual").value, document.getElementById("senha-nova").value);
      ok.textContent = "Senha atualizada com sucesso!";
      ok.classList.add("show");
      e.target.reset();
    } catch (err) {
      erro.textContent = err.message;
      erro.classList.add("show");
    }
  });

  function renderTudo() {
    renderMembros();
    renderAvaliacoes();
    renderVagas();
  }
  renderTudo();
})();
