/* =========================================================
   Comportamentos gerais do site público (main.js)
   ========================================================= */

(function () {
  /* PWA: registra o service worker (funciona offline / instalável) */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* Tema claro/escuro */
  function aplicarTema(tema) {
    document.documentElement.setAttribute("data-theme", tema);
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = tema === "dark" ? "☀️" : "🌙";
    });
  }
  const temaSalvo = RS.getTheme();
  aplicarTema(temaSalvo);

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const atual = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      RS.setTheme(atual);
      aplicarTema(atual);
    });
  });

  /* Menu mobile */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", navLinks.classList.contains("open"));
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  /* Sidebar dos painéis (mobile) */
  const sidebar = document.querySelector("[data-sidebar]");
  const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
  const sidebarOverlay = document.querySelector("[data-sidebar-overlay]");
  if (sidebar && sidebarToggle && sidebarOverlay) {
    const abrir = () => { sidebar.classList.add("open"); sidebarOverlay.classList.add("show"); };
    const fechar = () => { sidebar.classList.remove("open"); sidebarOverlay.classList.remove("show"); };
    sidebarToggle.addEventListener("click", abrir);
    sidebarOverlay.addEventListener("click", fechar);
    sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", fechar));
  }

  /* Ano no rodapé */
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Link do WhatsApp */
  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.href = `https://wa.me/${RS_CLUBE.whatsapp}`;
  });
  document.querySelectorAll("[data-whatsapp-numero]").forEach((el) => {
    el.textContent = RS_CLUBE.whatsappExibicao;
  });

  /* Botão compartilhar (Web Share API com fallback) */
  document.querySelectorAll("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const shareData = {
        title: "Raízes do Sertão — Lava Jato",
        text: "Ajude o Clube de Desbravadores Raízes do Sertão a chegar no Campori DSA 2027! 🌵",
        url: window.location.href,
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (e) { /* cancelado pelo usuário */ }
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          mostrarToast("Link copiado! Agora é só colar e compartilhar.");
        } catch (e) {
          alert(shareData.url);
        }
      }
    });
  });

  /* Contador regressivo (usado na home) */
  const countdownEl = document.querySelector("[data-countdown]");
  if (countdownEl) {
    let alvo;
    if (countdownEl.dataset.countdown === "auto-lavajato") {
      const hoje = new Date();
      alvo = new Date(hoje);
      alvo.setHours(7, 0, 0, 0);
      const diasAteDomingo = (7 - hoje.getDay()) % 7;
      alvo.setDate(alvo.getDate() + diasAteDomingo);
      if (alvo < hoje) alvo.setDate(alvo.getDate() + 7);
    } else {
      alvo = new Date(countdownEl.dataset.countdown + "T00:00:00");
    }
    function atualizar() {
      const agora = new Date();
      let diff = Math.max(0, alvo - agora);
      const dia = Math.floor(diff / 86400000); diff -= dia * 86400000;
      const hora = Math.floor(diff / 3600000); diff -= hora * 3600000;
      const min = Math.floor(diff / 60000); diff -= min * 60000;
      const seg = Math.floor(diff / 1000);
      countdownEl.querySelector('[data-c="d"]').textContent = String(dia).padStart(2, "0");
      countdownEl.querySelector('[data-c="h"]').textContent = String(hora).padStart(2, "0");
      countdownEl.querySelector('[data-c="m"]').textContent = String(min).padStart(2, "0");
      countdownEl.querySelector('[data-c="s"]').textContent = String(seg).padStart(2, "0");
    }
    atualizar();
    setInterval(atualizar, 1000);
  }

  /* Barra de progresso da meta */
  const metaEl = document.querySelector("[data-meta]");
  if (metaEl) {
    const meta = RS.getMeta();
    const pct = Math.min(100, Math.round((meta.arrecadado / meta.alvo) * 100));
    metaEl.querySelector("[data-meta-bar]").style.width = pct + "%";
    metaEl.querySelector("[data-meta-pct]").textContent = pct + "%";
    metaEl.querySelector("[data-meta-arrecadado]").textContent =
      meta.arrecadado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    metaEl.querySelector("[data-meta-alvo]").textContent =
      meta.alvo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* Monta calendário (accordion por mês) */
  const calEl = document.querySelector("[data-calendario]");
  if (calEl) {
    RS_CALENDARIO.forEach((mes, i) => {
      const det = document.createElement("details");
      det.className = "month-acc";
      if (i === 0) det.open = true;
      const itens = mes.itens
        .map(
          (it) => `<li class="${it.folga ? "folga" : ""} ${it.destaque ? "destaque" : ""}">
            <span class="d">${it.data}</span><span>${it.texto}</span>
          </li>`
        )
        .join("");
      det.innerHTML = `<summary>${mes.mes}</summary><ul>${itens}</ul>`;
      calEl.appendChild(det);
    });
  }

  /* Monta grade de unidades */
  const unidadesEl = document.querySelector("[data-unidades]");
  if (unidadesEl) {
    unidadesEl.innerHTML = RS_UNIDADES.map(
      (u) => `
      <div class="card unit-card">
        <div class="badge-wrap"><img src="${u.img}" alt="Emblema da unidade ${u.nome}" loading="lazy"></div>
        <h3>${u.nome}</h3>
        <div class="tag">Unidade do clube</div>
      </div>`
    ).join("");
  }

  /* Monta galeria de fotos/vídeos (pública) */
  const galeriaEl = document.querySelector("[data-galeria]");
  if (galeriaEl) {
    const eventos = RS.getGaleria().slice().sort((a, b) => (a.data < b.data ? 1 : -1));
    if (!eventos.length) {
      galeriaEl.innerHTML = `<div class="empty-state">Ainda não há álbuns publicados. A diretoria pode adicionar pelo painel da liderança.</div>`;
    } else {
      galeriaEl.innerHTML = eventos
        .map(
          (ev) => `
        <div class="card">
          ${ev.capa ? `<img src="${ev.capa}" alt="Capa do evento ${ev.evento}" style="border-radius:12px; margin-bottom:14px; aspect-ratio:16/9; object-fit:cover;" loading="lazy">` : ""}
          <span class="eyebrow">${ev.data ? new Date(ev.data + "T00:00:00").toLocaleDateString("pt-BR") : "Evento"}</span>
          <h3>${ev.evento}</h3>
          ${ev.descricao ? `<p>${ev.descricao}</p>` : ""}
          <a href="${ev.link}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Ver fotos e vídeos</a>
        </div>`
        )
        .join("");
    }
  }

  /* Monta linha do tempo de diretores */
  const diretoresEl = document.querySelector("[data-diretores]");
  if (diretoresEl) {
    diretoresEl.innerHTML = RS_DIRETORES.map(
      (d) => `<li><b>${d.periodo}</b>${d.nome}${d.nota ? ` — <em>${d.nota}</em>` : ""}</li>`
    ).join("");
  }

  window.mostrarToast = mostrarToast;
  function mostrarToast(msg) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2800);
  }
})();
