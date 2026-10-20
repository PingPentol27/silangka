/* SILANGKA — Service Worker: membuat aplikasi tetap terbuka tanpa sinyal.
 * Naikkan angka VERSI setiap kali Anda mengubah file aplikasi agar HP pengguna memuat versi baru. */
var VERSI = 'silangka-v2.0.0';
var INTI = [
  './', 'index.html', 'app.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'logo.png', 'arutmin.png', 'favicon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) {
    return Promise.all(INTI.map(function (u) { return c.add(u).catch(function () { }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                       // kiriman laporan (POST) tidak di-cache
  var url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;   // API selalu langsung
  if (/tile\.openstreetmap\.org$/.test(url.hostname)) return;            // ubin peta tidak disimpan

  // config.js & halaman: utamakan jaringan agar perubahan langsung terasa
  if (req.mode === 'navigate' || url.pathname.endsWith('config.js')) {
    e.respondWith(fetch(req).then(function (res) {
      var salin = res.clone(); caches.open(VERSI).then(function (c) { c.put(req.mode === 'navigate' ? 'index.html' : req, salin); });
      return res;
    }).catch(function () { return caches.match(req.mode === 'navigate' ? 'index.html' : req); }));
    return;
  }

  // Selain itu: ambil dari cache, perbarui diam-diam di latar belakang
  e.respondWith(caches.match(req).then(function (hit) {
    var jaringan = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var salin = res.clone(); caches.open(VERSI).then(function (c) { c.put(req, salin); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || jaringan;
  }));
});
