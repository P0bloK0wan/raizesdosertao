/* =========================================================
   Painel da Liderança
   ========================================================= */

(function () {
  const sessao = RS_AUTH.exigirSessao("lideranca");
  if (!sessao) return;

  document.getElementById("quem").textContent = sessao.nome;
  document.getElementById("btn-sair").addEventListener("click", RS_AUTH.logout);

  function unidadeNome(id) {
    const u = RS_UNIDADES.find((x) => x.id === id);
    return u ? u.nome : "—";
  }

  /* ---------------- Vagas ---------------- */
  function renderVagas() {
    const vagas = RS.getVagas();
    const tbody = document.getElementById("tbody-vagas");
    const vazio = document.getElementById("vagas-vazio");
    tbody.innerHTML = "";
    vazio.style.display = vagas.length ? "none" : "block";

    vagas.forEach((v) => {
      const fechada = !!v.unidadeId;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.data}</td>
        <td>${v.horario}</td>
        <td>${v.vagas}</td>
        <td>${fechada ? unidadeNome(v.unidadeId) : "—"}</td>
        <td>${v.responsavel || "—"}</td>
        <td><span class="pill ${fechada ? "pill-closed" : "pill-open"}">${fechada ? "Fechada" : "Aberta"}</span></td>
        <td class="row-actions">
          ${fechada ? `<button data-reabrir="${v.id}">Reabrir</button>` : ""}
          <button data-excluir="${v.id}" class="danger">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-reabrir]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const lista = RS.getVagas();
        const v = lista.find((x) => x.id === btn.dataset.reabrir);
        if (v) { v.unidadeId = null; v.membros = []; v.responsavel = ""; }
        RS.setVagas(lista);
        renderTudo();
        mostrarToast("Vaga reaberta.");
      })
    );
    tbody.querySelectorAll("[data-excluir]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (!confirm("Excluir esta vaga? Essa ação não pode ser desfeita.")) return;
        const lista = RS.getVagas().filter((x) => x.id !== btn.dataset.excluir);
        RS.setVagas(lista);
        renderTudo();
        mostrarToast("Vaga excluída.");
      })
    );
  }

  const modalVaga = document.getElementById("modal-vaga");
  document.getElementById("btn-nova-vaga").addEventListener("click", () => modalVaga.classList.add("show"));
  document.getElementById("btn-cancelar-vaga").addEventListener("click", () => modalVaga.classList.remove("show"));
  document.getElementById("form-vaga").addEventListener("submit", (e) => {
    e.preventDefault();
    const lista = RS.getVagas();
    lista.push({
      id: "v" + Date.now(),
      data: document.getElementById("vaga-data").value.trim(),
      horario: document.getElementById("vaga-horario").value.trim(),
      vagas: Number(document.getElementById("vaga-qtd").value) || 1,
      unidadeId: null,
      membros: [],
      responsavel: "",
    });
    RS.setVagas(lista);
    modalVaga.classList.remove("show");
    e.target.reset();
    document.getElementById("vaga-qtd").value = 4;
    renderTudo();
    mostrarToast("Vaga criada.");
  });

  /* ---------------- Desbravadores ---------------- */
  function renderDesbravadores() {
    const wrap = document.getElementById("desbravadores-lista");
    wrap.innerHTML = "";
    RS_UNIDADES.forEach((u) => {
      const membros = RS.getMembros(u.id);
      const det = document.createElement("details");
      det.className = "month-acc";
      const linhas = membros
        .map(
          (m) => `<tr>
            <td>${m.nome}</td><td>${m.nascimento || "—"}</td><td>${m.classe || "—"}</td>
            <td>${m.responsavel || "—"}</td><td>${m.telefone || "—"}</td>
            <td class="row-actions"><button class="danger" data-del-membro="${u.id}:${m.id}">Excluir</button></td>
          </tr>`
        )
        .join("");
      det.innerHTML = `
        <summary>${u.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${membros.length})</span></summary>
        <div style="padding:14px 20px 18px;">
          ${membros.length ? `<div class="table-wrap"><table class="data-table">
            <thead><tr><th>Nome</th><th>Nascimento</th><th>Classe</th><th>Responsável</th><th>Telefone</th><th></th></tr></thead>
            <tbody>${linhas}</tbody></table></div>` : `<p class="empty-state">Nenhum desbravador cadastrado por esta unidade ainda.</p>`}
        </div>`;
      wrap.appendChild(det);
    });

    wrap.querySelectorAll("[data-del-membro]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [uid, mid] = btn.dataset.delMembro.split(":");
        if (!confirm("Excluir este desbravador?")) return;
        const lista = RS.getMembros(uid).filter((m) => m.id !== mid);
        RS.setMembros(uid, lista);
        renderTudo();
        mostrarToast("Desbravador removido.");
      })
    );
  }

  /* ---------------- Desempenho semanal ---------------- */
  function mediaAvaliacao(a) {
    const soma = RS_CRITERIOS.reduce((acc, c) => acc + Number(a[c.id] || 0), 0);
    return soma / RS_CRITERIOS.length;
  }

  function renderDesempenho() {
    const linhas = [];
    RS_UNIDADES.forEach((u) => {
      const membros = RS.getMembros(u.id);
      const nomePorId = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
      const avaliacoes = RS.getAvaliacoes(u.id);
      const porMembro = {};
      avaliacoes.forEach((a) => {
        if (!porMembro[a.membroId]) porMembro[a.membroId] = [];
        porMembro[a.membroId].push(mediaAvaliacao(a));
      });
      Object.keys(porMembro).forEach((membroId) => {
        const medias = porMembro[membroId];
        const mediaGeral = medias.reduce((a, b) => a + b, 0) / medias.length;
        linhas.push({
          nome: nomePorId[membroId] || "(removido)",
          unidade: u.nome,
          qtd: medias.length,
          media: mediaGeral,
        });
      });
    });
    linhas.sort((a, b) => b.media - a.media);

    const tbody = document.getElementById("tbody-desempenho");
    const vazio = document.getElementById("desempenho-vazio");
    tbody.innerHTML = linhas
      .map((l) => `<tr><td>${l.nome}</td><td>${l.unidade}</td><td>${l.qtd}</td><td><strong>${l.media.toFixed(1)}</strong></td></tr>`)
      .join("");
    vazio.style.display = linhas.length ? "none" : "block";
  }

  /* ---------------- Galeria de fotos/vídeos ---------------- */
  function renderGaleria() {
    const eventos = RS.getGaleria().slice().sort((a, b) => (a.data < b.data ? 1 : -1));
    const tbody = document.getElementById("tbody-galeria");
    const vazio = document.getElementById("galeria-vazio");
    tbody.innerHTML = eventos
      .map(
        (ev) => `<tr>
          <td>${ev.evento}</td>
          <td>${ev.data ? new Date(ev.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
          <td><a href="${ev.link}" target="_blank" rel="noopener">Abrir álbum ↗</a></td>
          <td class="row-actions"><button class="danger" data-del-album="${ev.id}">Excluir</button></td>
        </tr>`
      )
      .join("");
    vazio.style.display = eventos.length ? "none" : "block";

    tbody.querySelectorAll("[data-del-album]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (!confirm("Excluir este álbum da galeria pública?")) return;
        RS.setGaleria(RS.getGaleria().filter((ev) => ev.id !== btn.dataset.delAlbum));
        renderTudo();
        mostrarToast("Álbum removido.");
      })
    );
  }

  const modalAlbum = document.getElementById("modal-album");
  document.getElementById("btn-novo-album").addEventListener("click", () => modalAlbum.classList.add("show"));
  document.getElementById("btn-cancelar-album").addEventListener("click", () => modalAlbum.classList.remove("show"));
  document.getElementById("form-album").addEventListener("submit", (e) => {
    e.preventDefault();
    const lista = RS.getGaleria();
    lista.push({
      id: "g" + Date.now(),
      evento: document.getElementById("al-evento").value.trim(),
      data: document.getElementById("al-data").value,
      link: document.getElementById("al-link").value.trim(),
      descricao: document.getElementById("al-descricao").value.trim(),
      capa: document.getElementById("al-capa").value.trim(),
    });
    RS.setGaleria(lista);
    modalAlbum.classList.remove("show");
    e.target.reset();
    renderTudo();
    mostrarToast("Álbum publicado no site!");
  });

  /* ---------------- Estatísticas ---------------- */
  function renderStats() {
    const vagas = RS.getVagas();
    const totalMembros = RS_UNIDADES.reduce((acc, u) => acc + RS.getMembros(u.id).length, 0);
    const abertas = vagas.filter((v) => !v.unidadeId).length;
    const fechadas = vagas.length - abertas;
    const meta = RS.getMeta();
    const pct = meta.alvo ? Math.min(100, Math.round((meta.arrecadado / meta.alvo) * 100)) : 0;

    document.getElementById("s-membros").textContent = totalMembros;
    document.getElementById("s-vagas-abertas").textContent = abertas;
    document.getElementById("s-vagas-fechadas").textContent = fechadas;
    document.getElementById("s-meta-pct").textContent = pct + "%";
  }

  /* ---------------- Meta ---------------- */
  function preencherMeta() {
    const meta = RS.getMeta();
    document.getElementById("meta-arrecadado").value = meta.arrecadado;
    document.getElementById("meta-alvo").value = meta.alvo;
  }
  document.getElementById("form-meta").addEventListener("submit", (e) => {
    e.preventDefault();
    RS.setMeta({
      arrecadado: Number(document.getElementById("meta-arrecadado").value) || 0,
      alvo: Number(document.getElementById("meta-alvo").value) || 1,
    });
    renderStats();
    mostrarToast("Meta atualizada.");
  });

  /* ---------------- Importar / Exportar ---------------- */
  document.getElementById("btn-exportar-tudo").addEventListener("click", () => RS.exportarTudo());
  document.getElementById("input-importar").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const resumo = await RS.importarArquivo(file);
      renderTudo();
      mostrarToast("Importado: " + resumo);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  });

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
    renderVagas();
    renderDesbravadores();
    renderDesempenho();
    renderGaleria();
    renderStats();
  }

  renderTudo();
  preencherMeta();
})();
