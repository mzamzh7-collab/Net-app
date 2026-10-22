
const CACHE_NAME = 'net-app-v6';
const ASSETS = [
  '/Net-app/',
  '/Net-app/index.html',
  '/Net-app/manifest.json',
  '/Net-app/icon-192.png',
  '/Net-app/icon-512.png'
];

// ═══ التثبيت ═══
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('بعض الملفات لم تُخزن:', err);
        // تخزين الملفات الحرجة فقط إذا فشل الباقي
        return cache.addAll(['/Net-app/', '/Net-app/index.html']);
      });
    })
  );
});

// ═══ التفعيل ═══
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// ═══ مساعد: إيجاد مفتاح index.html المخزن ═══
function findCachedIndex() {
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.keys().then((keys) => {
      const indexKey = keys.find(k => 
        k.url.endsWith('/index.html') || 
        k.url.endsWith('/Net-app/')
      );
      return indexKey ? cache.match(indexKey) : null;
    });
  });
}

// ═══ الجلب ═══
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // تجاهل طلبات Firebase و Google (لا نخزنها)
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('cloudfunctions')) {
    return;
  }

  // ═══ 1. طلبات التنقل (فتح الصفحة) - Cache First + تحديث خلفي ═══
  if (event.request.mode === 'navigate') {
    event.respondWith(
      findCachedIndex().then((cachedResponse) => {

        // تحديث في الخلفية (لا ينتظره المستخدم)
        const fetchUpdate = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put('/Net-app/index.html', clone);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        // إذا وُجد كاش، اعرضه فوراً (فتح سريع بدون شاشة بيضاء)
        if (cachedResponse) {
          return cachedResponse;
        }

        // لا يوجد كاش → انتظر الشبكة
        return fetchUpdate.then((r) => r || new Response(
          '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>Net</title></head><body style="font-family:system-ui;text-align:center;padding:50px;background:#40E0D0;color:white;"><h1 style="font-size:60px;">Net</h1><h2>لا يوجد اتصال</h2><p>افتح التطبيق مرة واحدة مع اتصال بالإنترنت</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        ));
      })
    );
    return;
  }

  // ═══ 2. الملفات الأخرى - Cache First + تحديث خلفي ═══
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
