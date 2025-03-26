// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

const VERSION = "1.0.7"
// ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ
if (workbox) {
  console.log('Workbox is loaded 🎉');

  // ตรวจสอบว่าไฟล์ใน cache มีการ precache และ revision ที่ตรงกับ VERSION หรือไม่
  caches.open(workbox.core.cacheName).then((cache) => {
    // ตรวจสอบว่าไฟล์มีอยู่ใน cache หรือไม่
    cache.match('/').then((response) => {
      if (response) {
        response.text().then((cachedVersion) => {
          console.log('Cached version:', cachedVersion);
          console.log('Cached version New:', VERSION);

          // เปรียบเทียบ VERSION ที่เก็บใน cache กับ VERSION ปัจจุบัน
          if (cachedVersion !== VERSION) {
            console.warn('Version mismatch, updating cache...');
            // ลบ cache เก่าก่อน
            cache.delete('/').then(() => {
              // หลังจากลบ cache เก่าแล้ว, ทำการเพิ่มไฟล์ใหม่ที่มี VERSION ปัจจุบัน
              updateCache(cache);
            });
          } else {
            console.warn('Version matches, no update needed');
          }
        });
      } else {
        console.log('No cached version found, storing current VERSION...');
        // หากไม่มีไฟล์ cached, ทำการเพิ่ม VERSION ใหม่
        updateCache(cache);
      }
    });
  });

  // ฟังก์ชั่นในการอัพเดต cache หรือทำบางอย่าง
  function updateCache() {
    // ลบ cache ทั้งหมดก่อน
    clearAllCaches();

    // เก็บ VERSION ใหม่ใน cache
    caches.open(workbox.core.cacheName).then((cache) => {
      cache.put('/', new Response(VERSION)); // เก็บ VERSION ใหม่
    });

    // Precache ไฟล์ที่กำหนดไว้ล่วงหน้าใหม่
    workbox.precaching.precacheAndRoute([
      { url: '/', revision: VERSION },
      { url: '/login', revision: VERSION },
      { url: '/main', revision: VERSION },
      { url: '/receive', revision: VERSION },
      { url: '/transfer', revision: VERSION },
      { url: '/stock', revision: VERSION },
      { url: '/price-check', revision: VERSION },
      { url: '/icons/icon-192x192.png', revision: VERSION },
      { url: '/icons/icon-512x512.png', revision: VERSION },
    ]);
  }

  // ฟังก์ชั่นในการลบ cache ทั้งหมด
  function clearAllCaches() {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName).then(() => {
          console.log(`Cache ${cacheName} has been deleted.`);
        });
      });
    });
  }

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