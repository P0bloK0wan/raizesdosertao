/* Service worker simples — cache do "app shell" para o site
   abrir rápido e funcionar offline depois da primeira visita. */

const CACHE_NAME = "raizes-do-sertao-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login-lideranca.html",
  "./login-unidade.html",
  "./painel-lideranca.html",
  "./painel-unidade.html",
  "./404.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/data.js",
  "./assets/js/store.js",
  "./assets/js/firebase.js",
  "./assets/js/auth.js",
  "./assets/js/main.js",
  "./assets/js/painel-lideranca.js",
  "./assets/js/painel-unidade.js",
  "./assets/img/logo.png",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/unit_tarantula.png",
  "./assets/img/unit_andorinha1.png",
  "./assets/img/unit_andorinha2.png",
  "./assets/img/unit_carcara.png",
  "./assets/img/unit_raposa.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Só cuida dos arquivos do próprio site — deixa passar direto
  // qualquer chamada pro Firebase, fontes do Google, etc.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
