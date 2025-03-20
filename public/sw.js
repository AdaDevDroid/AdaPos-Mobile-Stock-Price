// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

// ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ
if (workbox) {
  console.log('Workbox is loaded 🎉');

  // Precache ไฟล์ที่กำหนดไว้ล่วงหน้า
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: '1' },
    { url: '/login', revision: '1' },
    { url: '/main', revision: '1' },
    { url: '/receive', revision: '1' },
    { url: '/transfer', revision: '1' },
    { url: '/stock', revision: '1' },
    { url: '/price-check', revision: '1' },
    { url: '/icons/icon-192x192.png', revision: '1' },
    { url: '/icons/icon-512x512.png', revision: '1' },
  ]);

  // ใช้ Network First สำหรับ API /api/auth/
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/auth/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'my-api-cache-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50, // เก็บได้สูงสุด 50 รายการ
          maxAgeSeconds: 7 * 24 * 60 * 60, // เก็บข้อมูลในแคช 7 วัน
        }),
      ],
    })
  );

  // ใช้ Stale While Revalidate สำหรับไฟล์ CSS และ JS
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // ใช้ Cache First สำหรับไฟล์รูปภาพ
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100, // เก็บได้สูงสุด 100 รูป
          maxAgeSeconds: 30 * 24 * 60 * 60, // เก็บข้อมูลในแคช 30 วัน
        }),
      ],
    })
  );
} else {
  console.log('Workbox failed to load 😢');
}