const CACHE_NAME = 'net-app-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './offline.html'
];

// تثبيت وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting(); // إجبار التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name); // حذف الكاش القديم
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية الجلب: الكاش أولاً، ثم الشبكة
self.addEventListener('fetch', (event) => {
  // إذا كان الطلب لصفحة (Navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request).catch(() => {
          return caches.match('./offline.html');
        });
      })
    );
    return;
  }

  // للملفات الأخرى (صور، أكواد)، نستخدم الكاش أولاً
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
