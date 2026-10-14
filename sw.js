const CACHE_VERSION = "net-app-v3";
const FILES = ["./", "./index.html", "./manifest.json"];

// ═══ التثبيت ═══
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(FILES);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ═══ التنشيط: حذف الـ Cache القديم ═══
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ═══ الجلب: الشبكة أولاً، ثم الـ Cache ═══
self.addEventListener("fetch", function(e) {
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var responseClone = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(e.request, responseClone);
        });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  } else {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});

// ═══ رسالة من التطبيق ═══
self.addEventListener("message", function(e) {
  if (e.data === "skipWaiting") {
    self.skipWaiting();
  }
});
