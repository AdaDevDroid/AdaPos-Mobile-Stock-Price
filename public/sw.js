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
  const { request } = event;
  const url = new URL(request.url);

  // ✅ เฉพาะ API /api/auth/ → ใช้ Network First แล้วแคช
  if (url.pathname.startsWith('/api/auth/')) {
    event.respondWith(
      caches.open('my-api-cache-v1').then(async (cache) => {
        try {
          // ❌ ห้าม Cache ถ้าเป็น POST, PUT, DELETE (เพราะ Response เปลี่ยนแปลง)
          if (request.method !== 'GET') {
            return fetch(request);
          }

          // ✅ Fetch API และเก็บลงแคช
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch (error) {
          console.error("🔴 API Fetch Error:", error);
          
          // ✅ ลองดึงจากแคช ถ้าไม่มีให้คืนค่า JSON แจ้งเตือน
          return (
            (await caches.match(request)) ||
            new Response(
              JSON.stringify({ message: "Offline Mode: ใช้ Token ล่าสุด" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
      })
    );
    return;
  }

  // ✅ ส่วนอื่นๆ ใช้ Cache First
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});