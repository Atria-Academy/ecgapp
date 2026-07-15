/* PALS Rhythm Quest · service worker
   Cache leve (stale-while-revalidate) para carregar rápido no wifi do congresso
   e funcionar mesmo com conexão instável. Só ativa quando hospedado em HTTPS.
   Troque a versão do cache ao publicar uma atualização. */
const CACHE = 'prq-v1';
const ASSETS = [
  './',
  './index.html',
  './modos.html',
  './partida.html',
  './dashboard.html',
  './ranking.html',
  './emblemas.html',
  './biblioteca.html',
  './css/style.css',
  './js/data.js',
  './js/ecg.js',
  './js/state.js',
  './js/ui.js',
  './js/game.js',
  './manifest.webmanifest',
  './assets/stop-logo.webp',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // adiciona o que conseguir; não falha a instalação por um asset ausente
    return Promise.allSettled(ASSETS.map(function (u) { return c.add(u); }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // não intercepta origens externas (ex.: Google Fonts) nem navegações cruzadas
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      const network = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // offline: cai para o cache; se for navegação, serve a home
        return cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
      return cached || network;
    })
  );
});
