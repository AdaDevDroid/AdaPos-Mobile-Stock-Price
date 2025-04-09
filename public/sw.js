// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

const VERSION = "1.0.1"
// ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ
console.log('ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ');
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
        console.log('Cached version:', cachedVersion);
        console.log('Cached version New:', VERSION);
        console.log('No cached version found, storing current VERSION...');
        // หากไม่มีไฟล์ cached, ทำการเพิ่ม VERSION ใหม่
        updateCache(cache);
      }
    });
    console.log('Cached ไม่มีไฟล์ cache โหลดใหม่');
    updateCache(cache);
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
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/login`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/main`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/receive`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/transfer`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/stock`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/price-check`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/icons/icon-192x192.png`, revision: VERSION },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH}/icons/icon-512x512.png`, revision: VERSION },
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
          maxEntries: 100, 
          maxAgeSeconds: 30 * 24 * 60 * 60, 
        }),
      ],
    })
  );
} else {
  console.log('Workbox failed to load 😢');
}