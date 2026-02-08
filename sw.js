var CACHE_NAME = 'pw-gen-v6';
var ASSETS = [
  './',
  './index.html',
  './css/bootstrap.min.css',
  './css/bootstrap-icons.min.css',
  './css/fonts/bootstrap-icons.woff2',
  './css/fonts/bootstrap-icons.woff',
  './css/style.min.css',
  './js/bootstrap.min.js',
  './js/sha512.min.js',
  './js/PasswordQualityCalculator.min.js',
  './src/wordlist.min.js',
  './src/seek_password.min.js',
  './src/pbkdf2-worker.min.js',
  './src/i18n.min.js',
  './src/service-codes.min.js',
  './src/app.min.js',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json',
  './offline.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      var oldNames = names.filter(function(name) {
        return name !== CACHE_NAME;
      });
      var hadOldCaches = oldNames.length > 0;
      return Promise.all(
        oldNames.map(function(name) { return caches.delete(name); })
      ).then(function() {
        return hadOldCaches;
      });
    }).then(function(hadOldCaches) {
      return self.clients.claim().then(function() {
        return hadOldCaches;
      });
    }).then(function(hadOldCaches) {
      if (hadOldCaches) {
        return self.clients.matchAll().then(function(clients) {
          clients.forEach(function(client) {
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      }
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    }).catch(function() {
      if (event.request.mode === 'navigate') {
        return caches.match('./offline.html');
      }
    })
  );
});
