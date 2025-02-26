self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('my-app-cache-v1').then((cache) => {
        return cache.addAll([
          '/',
          '/login',
          '/main',
          '/receive',
          '/transfer',
          '/stock',
          '/price-check',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ]);
      })
    );
  });

  self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/auth/')) {
    event.respondWith(
      caches.open('my-api-cache-v1').then(async (cache) => {
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone()); // 🔥 Cache API Response
          return response;
        } catch {
          return await caches.match(event.request);
        } // 🔄 ถ้าออฟไลน์ ใช้ Cache แทน
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});