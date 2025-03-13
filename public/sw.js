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
    const url = event.request.url;
  
    if (url.includes('/api/auth/')) {
      event.respondWith(
        caches.open('my-api-cache-v1').then(async (cache) => {
          try {
            const response = await fetch(event.request);
            if (response.ok) {
              cache.put(event.request, response.clone()); // ✅ Cache เฉพาะ Response ที่ใช้ได้
            }
            return response;
          } catch (error) {
            console.warn("⚠️ API Fetch Failed, using cache:", error);
            return (await caches.match(event.request)) || new Response("Offline mode", { status: 503 });
          }
        })
      );
    } else {
      event.respondWith(
        caches.match(event.request).then((cacheResponse) => {
          return (
            cacheResponse ||
            fetch(event.request)
              .then((networkResponse) => {
                return caches.open('my-app-cache-v1').then((cache) => {
                  cache.put(event.request, networkResponse.clone()); // ✅ Cache Static Files
                  return networkResponse;
                });
              })
              .catch(() => new Response("Offline mode", { status: 503 }))
          );
        })
      );
    }
  });