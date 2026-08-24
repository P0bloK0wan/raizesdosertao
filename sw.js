/* Service worker simples — cache do "app shell" para o site
   abrir rápido e funcionar offline depois da primeira visita. */

const CACHE_NAME = "raizes-do-sertao-v1";
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
  "./assets/js/storage.js",
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
