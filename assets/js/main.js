/* =========================================================
   Comportamentos gerais do site (main.js)
   ========================================================= */

import { RS_CLUBE, RS_LINKS } from "./data.js";
import { getTheme, setTheme } from "./store.js";

/* ---------------- Cabeçalho e rodapé (injetados em toda página) ---------------- */
const NAV_ITEMS = [
  { href: "index.html", label: "🏠 Início" },
  { href: "historia.html", label: "🌵 Nossa História" },
  { href: "midia.html", label: "📸 Mídia" },
  { href: "campori.html", label: "💙 Campori DSA 2027" },
  { href: "lava-jato.html", label: "🚗 Lava-Jato" },
  { href: "redes.html", label: "📱 Nossas Redes" },
  { href: "login.html", label: "🔐 Login" },
];

function paginaAtual() {
  const partes = window.location.pathname.split("/");
  const arquivo = partes[partes.length - 1] || "index.html";
  return arquivo === "" ? "index.html" : arquivo;
}

function montarCabecalho() {
  const alvo = document.querySelector("[data-site-header]");
  if (!alvo) return;
  const atual = paginaAtual();
  alvo.innerHTML = `
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="brand">
          <img src="assets/img/logo.png" alt="Emblema Raízes do Sertão">
          <span>Raízes do Sertão<small>Clube de Desbravadores</small></span>
        </a>
        <nav class="nav-links" data-nav-links>
          ${NAV_ITEMS.map((it) => `<a href="${it.href}" class="${it.href === atual ? "active" : ""}">${it.label}</a>`).join("")}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" data-theme-toggle aria-label="Alternar tema claro/escuro"><span data-theme-icon>🌙</span></button>
          <button class="nav-toggle" data-nav-toggle aria-label="Abrir menu" aria-expanded="false"><span></span></button>
        </div>
      </div>
    </header>`;
}

function montarRodape() {
  const alvo = document.querySelector("[data-site-footer]");
  if (!alvo) return;
  alvo.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <a href="index.html" class="brand" style="margin-bottom:10px;">
            <img src="assets/img/logo.png" alt="Emblema Raízes do Sertão">
            <span>Raízes do Sertão</span>
          </a>
          <p style="opacity:.75; max-width:34ch;">Clube de Desbravadores — Região 13, 4º Distrito, APeC. Sede: Vila Eduardo.</p>
        </div>
        <div>
          <h4>Navegação</h4>
          <ul>
            ${NAV_ITEMS.map((it) => `<li><a href="${it.href}">${it.label.replace(/^\S+\s/, "")}</a></li>`).join("")}
          </ul>
        </div>
        <div>
          <h4>Nossas Redes</h4>
          <ul>
            <li><a href="${RS_LINKS.instagramClube}" target="_blank" rel="noopener">📸 Instagram do Clube</a></li>
            <li><a href="${RS_LINKS.instagramIgreja}" target="_blank" rel="noopener">⛪ Instagram da Igreja</a></li>
            <li><a href="${RS_LINKS.youtubeIgreja}" target="_blank" rel="noopener">▶️ YouTube da Igreja</a></li>
            <li><a href="${RS_LINKS.siteIgreja}" target="_blank" rel="noopener">🌐 Site da Igreja</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© <span data-ano></span> Raízes do Sertão — feito com 🌵 pelo clube.</div>
    </footer>
    <a class="float-whatsapp" data-whatsapp-link target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
      <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.6 4.44 1.73 6.37L3.2 28.8l6.6-1.7a12.75 12.75 0 0 0 6.2 1.6h.001c7.07 0 12.8-5.73 12.8-12.8s-5.73-12.7-12.8-12.7zm0 23.13c-1.94 0-3.83-.52-5.48-1.5l-.39-.23-3.92 1.02 1.05-3.82-.25-.4a10.5 10.5 0 0 1-1.61-5.6c0-5.83 4.75-10.58 10.6-10.58 2.83 0 5.49 1.1 7.49 3.11a10.5 10.5 0 0 1 3.1 7.48c0 5.84-4.75 10.52-10.59 10.52zm5.8-7.88c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.76-2.19-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.39-.26-.63-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.53 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z"/></svg>
    </a>`;
}

montarCabecalho();
montarRodape();

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
aplicarTema(getTheme());

document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const atual = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(atual);
    aplicarTema(atual);
  });
});

/* Menu mobile */
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
if (navToggle && navLinks) {
  const abrirNav = () => {
    navLinks.classList.add("open");
    navToggle.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("scroll-lock");
  };
  const fecharNav = () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("scroll-lock");
  };
  navToggle.addEventListener("click", () => (navLinks.classList.contains("open") ? fecharNav() : abrirNav()));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", fecharNav));
}

/* Sidebar dos painéis (mobile) */
const sidebar = document.querySelector("[data-sidebar]");
const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
const sidebarOverlay = document.querySelector("[data-sidebar-overlay]");
if (sidebar && sidebarToggle && sidebarOverlay) {
  const abrir = () => {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
    sidebarToggle.classList.add("open");
    document.body.classList.add("scroll-lock");
  };
  const fechar = () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    sidebarToggle.classList.remove("open");
    document.body.classList.remove("scroll-lock");
  };
  sidebarToggle.addEventListener("click", abrir);
  sidebarOverlay.addEventListener("click", fechar);
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", fechar));
}

/* "Aparecer ao rolar" — elementos com [data-reveal] ganham .in-view quando
   entram na tela (ex.: dispara o desenho de uma seta em .scribble-arrow). */
const elementosRevelar = document.querySelectorAll("[data-reveal]");
if (elementosRevelar.length) {
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("in-view");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  elementosRevelar.forEach((el) => observador.observe(el));
}

/* Ano no rodapé */
document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* Link do WhatsApp genérico (contato do clube) */
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
      title: "Raízes do Sertão",
      text: "Conheça o Clube de Desbravadores Raízes do Sertão! 🌵",
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

/* Contador regressivo genérico — usa [data-countdown="AAAA-MM-DD"] */
export function iniciarContagem(el, dataAlvo) {
  const alvo = new Date(dataAlvo + "T09:00:00");
  function atualizar() {
    const agora = new Date();
    let diff = Math.max(0, alvo - agora);
    const dia = Math.floor(diff / 86400000); diff -= dia * 86400000;
    const hora = Math.floor(diff / 3600000); diff -= hora * 3600000;
    const min = Math.floor(diff / 60000); diff -= min * 60000;
    const seg = Math.floor(diff / 1000);
    el.querySelector('[data-c="d"]').textContent = String(dia).padStart(2, "0");
    el.querySelector('[data-c="h"]').textContent = String(hora).padStart(2, "0");
    el.querySelector('[data-c="m"]').textContent = String(min).padStart(2, "0");
    el.querySelector('[data-c="s"]').textContent = String(seg).padStart(2, "0");
  }
  atualizar();
  return setInterval(atualizar, 1000);
}

/* Beep curto de notificação (ex.: aviso novo no Mural) — gerado na hora
   via Web Audio API, sem precisar de nenhum arquivo de áudio. */
export function tocarSomNotificacao() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch (e) { /* navegador sem suporte — não é crítico, só não toca */ }
}
window.tocarSomNotificacao = tocarSomNotificacao;

export function mostrarToast(msg) {
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
window.mostrarToast = mostrarToast;
