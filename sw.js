// Konnectly service worker. Upload next to index.html.
// - Libraries (React, Firebase, icons, fonts, map) are saved after the first visit,
//   so the app opens much faster next time and on weak campus networks.
// - The page itself is always fetched fresh when online, with the last copy as backup.
const CACHE = 'konnectly-v3';
const LIB_HOSTS = ['www.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('./', copy); }); return res;
    }).catch(function () {
      return caches.match('./').then(function (hit) { return hit || new Response('<h1 style="font-family:sans-serif">You are offline</h1><p style="font-family:sans-serif">Reconnect to use Konnectly.</p>', { headers: { 'Content-Type': 'text/html' } }); });
    }));
    return;
  }
  // Pinned library versions never change, so a saved copy is always right.
  // (Database traffic goes to firestore.googleapis.com and is never cached here.)
  if (LIB_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } return res; });
    }));
  }
});
