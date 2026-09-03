/* =========================================================
   Convite de instalação (PWA) — só usado nos painéis (liderança
   e unidade). Mostra uma faixa fixa oferecendo "adicionar à tela
   inicial"; se a pessoa ignorar/dispensar, volta a aparecer depois
   de alguns dias (não incomoda todo dia, mas também não desiste).
   ========================================================= */

const CHAVE_DISPENSADO = "rs_pwa_install_dismissed";
const DIAS_PRA_REAPARECER = 3;

function jaInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function podeMostrarAgora() {
  const ultimo = localStorage.getItem(CHAVE_DISPENSADO);
  if (!ultimo) return true;
  const diasPassados = (Date.now() - Number(ultimo)) / (1000 * 60 * 60 * 24);
  return diasPassados >= DIAS_PRA_REAPARECER;
}

function marcarDispensado() {
  localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
}

function ehIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function criarFaixa({ textoBotao, aoClicarInstalar }) {
  const faixa = document.createElement("div");
  faixa.className = "pwa-install-banner";
  faixa.innerHTML = `
    <span>📲 Adicione o site à tela inicial do celular pra abrir mais rápido, igual um app.</span>
    <div class="pwa-install-acoes">
      ${textoBotao ? `<button type="button" class="btn btn-primary btn-sm" id="pwa-install-btn">${textoBotao}</button>` : ""}
      <button type="button" class="btn btn-outline btn-sm" id="pwa-install-fechar" aria-label="Dispensar">✕</button>
    </div>`;
  document.body.appendChild(faixa);
  requestAnimationFrame(() => faixa.classList.add("show"));

  document.getElementById("pwa-install-fechar").addEventListener("click", () => {
    marcarDispensado();
    faixa.remove();
  });
  const btnInstalar = document.getElementById("pwa-install-btn");
  if (btnInstalar && aoClicarInstalar) {
    btnInstalar.addEventListener("click", async () => {
      await aoClicarInstalar();
      marcarDispensado();
      faixa.remove();
    });
  }
  return faixa;
}

export function iniciarConvitePwa() {
  if (jaInstalado() || !podeMostrarAgora()) return;

  if (ehIOS()) {
    // iOS/Safari não dispara "beforeinstallprompt" — só dá pra
    // instalar manualmente, então mostramos a instrução direto.
    criarFaixa({
      textoBotao: null,
    });
    const faixaIOS = document.querySelector(".pwa-install-banner span");
    if (faixaIOS) {
      faixaIOS.textContent = "📲 Pra instalar: toque em Compartilhar e depois em \"Adicionar à Tela de Início\".";
    }
    return;
  }

  let promptEvento = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptEvento = e;
    criarFaixa({
      textoBotao: "Instalar",
      aoClicarInstalar: async () => {
        if (!promptEvento) return;
        promptEvento.prompt();
        await promptEvento.userChoice;
        promptEvento = null;
      },
    });
  });
}
