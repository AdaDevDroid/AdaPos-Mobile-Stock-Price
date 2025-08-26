// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

const VERSION = "1.0.7"; // เวอร์ชั่น
const url = new URL(self.location);
const BASE_PATH = url.searchParams.get('basePath') || '/AdaCheckStockSTD'; // กำหนด basePath ถ้ามี

// ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ
console.log('ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ');
if (workbox) {
  console.log('Workbox is loaded 🎉')

  updateCache();

  // ฟังก์ชั่นในการอัพเดต cache หรือทำบางอย่าง
  function updateCache() {
    // ลบ cache ทั้งหมดก่อน
    //clearAllCaches();
    updateStatic();
    // เก็บ VERSION ใหม่ใน cache
    caches.open(workbox.core.cacheName).then((cache) => {
      cache.put(`${BASE_PATH}/`, new Response(VERSION)); // เก็บ VERSION ใหม่
    });

    // Precache ไฟล์ที่กำหนดไว้ล่วงหน้าใหม่ with BASE_PATH
    workbox.precaching.precacheAndRoute([
      { url: `${BASE_PATH}/`, revision: VERSION },
      { url: `${BASE_PATH}/login`, revision: VERSION },
      { url: `${BASE_PATH}/main`, revision: VERSION },
      { url: `${BASE_PATH}/receive`, revision: VERSION },
      { url: `${BASE_PATH}/transfer`, revision: VERSION },
      { url: `${BASE_PATH}/stock`, revision: VERSION },
      { url: `${BASE_PATH}/price-check`, revision: VERSION },
      { url: `${BASE_PATH}/icons/icon-192x192.png`, revision: VERSION },
      { url: `${BASE_PATH}/icons/icon-512x512.png`, revision: VERSION },
    ]);
  }

  async function updateStatic() {
    const cache = await caches.open('static-resources');
    const urls = [
      `${BASE_PATH}/_next/image?url=%2FAdaCheckStockSTD%2Ficons%2FlogoAdaLogin.png&w=256&q=75`,
      `${BASE_PATH}/_next/static/chunks/2170a4aa-49b5104fb06205c3.js`,
      `${BASE_PATH}/_next/static/chunks/463-10d052a96af0e96e.js`,
      `${BASE_PATH}/_next/static/chunks/488-2fc4e73c5bf7a927.js`,
      `${BASE_PATH}/_next/static/chunks/488-4b36c4bd6902d2cb.js`,
      `${BASE_PATH}/_next/static/chunks/4bd1b696-abe71f0426e03d8b.js`,
      `${BASE_PATH}/_next/static/chunks/626-e94f734356ed4534.js`,
      `${BASE_PATH}/_next/static/chunks/684-b1f3f458c052c98c.js`,
      `${BASE_PATH}/_next/static/chunks/7cb1fa1f-1822bc2611099e2d.js`,
      `${BASE_PATH}/_next/static/chunks/899-33742bc382cdccc3.js`,
      `${BASE_PATH}/_next/static/chunks/899-3e454b2a30b54811.js`,
      `${BASE_PATH}/_next/static/chunks/8e1d74a4-fe16d9e17b9732e7.js`,
      `${BASE_PATH}/_next/static/chunks/aaea2bcf-ac6970987f5bc297.js`,
      `${BASE_PATH}/_next/static/chunks/app/layout-0e9a7711cdb82ca7.js`,
      `${BASE_PATH}/_next/static/chunks/app/login/page-b1a3c19fe7111d71.js`,
      `${BASE_PATH}/_next/static/chunks/app/login/page-b227cb706b94a32c.js`,
      `${BASE_PATH}/_next/static/chunks/app/main/page-02d0bc39c092c8b1.js`,
      `${BASE_PATH}/_next/static/chunks/app/main/page-54e752cd7887dba3.js`,
      `${BASE_PATH}/_next/static/chunks/app/page-8bb3bb4468f4cd36.js`,
      `${BASE_PATH}/_next/static/chunks/app/price-check/page-0a88467def72aafd.js`,
      `${BASE_PATH}/_next/static/chunks/app/price-check/page-ede0a4384f084c8e.js`,
      `${BASE_PATH}/_next/static/chunks/app/receive/page-3b266abb2a77f9ef.js`,
      `${BASE_PATH}/_next/static/chunks/app/stock/page-671bd78aa0b6cecd.js`,
      `${BASE_PATH}/_next/static/chunks/app/transfer/page-c87935219c76274e.js`,
      `${BASE_PATH}/_next/static/chunks/e34aaff9-9d0e4ab542d5999d.js`,
      `${BASE_PATH}/_next/static/chunks/ee560e2c-8a73055faacac193.js`,
      `${BASE_PATH}/_next/static/chunks/main-app-de7cbf8463ce616b.js`,
      `${BASE_PATH}/_next/static/chunks/webpack-9fe7c363585b0767.js`,
      `${BASE_PATH}/_next/static/css/2892dccee8337258.css`,
      `${BASE_PATH}/_next/static/css/7d5e323db8624040.css`,
      `${BASE_PATH}/favicon.ico`,
      `${BASE_PATH}/icons/logoAda.png`
    ];

    await Promise.all(
      urls.map(url =>
        fetch(url).then(response => {
          if (response.ok) return cache.put(url, response.clone());
          else console.warn('❌ โหลดไม่ได้:', url);
        }).catch(err => { 
          console.warn('❌ เกิดข้อผิดพลาดในการโหลด:', url, err);
        })
      )
    );

    console.log('✅ preload static-resources เสร็จเรียบร้อย!');
  }

  // ใช้ Stale While Revalidate สำหรับไฟล์ CSS และ JS
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );
} else {
  console.log('Workbox failed to load 😢');
}