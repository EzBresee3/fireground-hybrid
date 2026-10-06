/* Fireground Hybrid service worker: cache-first app shell, versioned cache. */
const VERSION = 'dev'; // the deploy workflow stamps the commit SHA here, so every deploy offers an update
const CACHE = 'fireground-' + VERSION;
const SHELL = [
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js', 'js/program.js', 'js/storage.js', 'js/sync.js', 'js/coach.js', 'js/exercises.js',
  'fonts/barlow-400.woff2', 'fonts/barlow-500.woff2', 'fonts/barlow-600.woff2',
  'fonts/barlow-condensed-500.woff2', 'fonts/barlow-condensed-600.woff2', 'fonts/barlow-condensed-700.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  // Bypass the HTTP cache so a new version never precaches stale files. No skipWaiting():
  // the page shows an "Update available" banner and the user decides when to reload.
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('fireground-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const shell = new URL('index.html', self.registration.scope).href;
    event.respondWith(caches.open(CACHE).then(c => c.match(shell)).then(r => r || fetch(req)));
    return;
  }
  event.respondWith(caches.open(CACHE).then(c => c.match(req, {ignoreSearch: true})).then(r => r || fetch(req)));
});
