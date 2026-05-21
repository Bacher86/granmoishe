// Gran Moishe 2026 — Service Worker v3
// IMPORTANTE: Los .html NUNCA se cachean — siempre se sirven de la red
const CACHE = 'granmoishe-juego-v3';

// Solo cachear assets estáticos (NO html)
const STATIC_ASSETS = [
  '/manifest.json',
  '/almagro.jpg',
];

// Nunca cachear estas URLs
const NEVER_CACHE = ['.html', 'firebase', 'googleapis', 'gstatic', 'localhost'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC_ASSETS.filter(a => !a.endsWith('.html'))))
      .catch(() => {})
  );
  self.skipWaiting(); // Activar inmediatamente sin esperar
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Borrar TODOS los cachés viejos (incluyendo v2 y cualquier otro)
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('[SW] Borrando caché viejo:', k);
        return caches.delete(k); // Borra todo, incluso v3 — se recrea solo
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca interceptar estas requests — van directo a la red
  const skip = NEVER_CACHE.some(pattern => url.includes(pattern));
  if (skip) return;

  // Para assets estáticos: network first, caché como fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Solo cachear respuestas exitosas de assets estáticos (no html)
        if (response.ok && !url.endsWith('.html')) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
