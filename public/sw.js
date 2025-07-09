// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

const VERSION = "1.0.5"; // เวอร์ชั่น
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
      `${BASE_PATH}/AdaFileServer/AdaPos5Dev/Adasoft/AdaFile/00039/company/250410133751648c47bae5d9128.png`,
      `${BASE_PATH}/_next/image?url=%2FAdaCheckStockSTD%2Ficons%2FlogoAdaLogin.png&w=256&q=75`,
      `${BASE_PATH}/_next/static/chunks/2170a4aa-49b5104fb06205c3.js`,
      `${BASE_PATH}/_next/static/chunks/463-26d0300b0cad1c8a.js`,
      `${BASE_PATH}/_next/static/chunks/488-4b36c4bd6902d2cb.js`,
      `${BASE_PATH}/_next/static/chunks/4bd1b696-b56b174fe27827d1.js`,
      `${BASE_PATH}/_next/static/chunks/626-e94f734356ed4534.js`,
      `${BASE_PATH}/_next/static/chunks/684-6a88eb906b4903b6.js`,
      `${BASE_PATH}/_next/static/chunks/7cb1fa1f-1822bc2611099e2d.js`,
      `${BASE_PATH}/_next/static/chunks/899-33742bc382cdccc3.js`,
      `${BASE_PATH}/_next/static/chunks/836-53d164cd3468ff05.js`,
      `${BASE_PATH}/_next/static/chunks/8e1d74a4-fe16d9e17b9732e7.js`,
      `${BASE_PATH}/_next/static/chunks/aaea2bcf-ac6970987f5bc297.js`,
      `${BASE_PATH}/_next/static/chunks/app/layout-3e31d2da671e459a.js`,
      `${BASE_PATH}/_next/static/chunks/app/login/page-ce2e8e7d282757d2.js`,
      `${BASE_PATH}/_next/static/chunks/app/main/page-52305ece46667372.js	`,
      `${BASE_PATH}/_next/static/chunks/app/login/page-3f97dd2ce14bb1b0.js`,
      `${BASE_PATH}/_next/static/chunks/app/main/page-1af1dffdd2bbfcc9.js`,
      `${BASE_PATH}/_next/static/chunks/app/page-e5d451557ffaafa7.js`,
      `${BASE_PATH}/_next/static/chunks/app/price-check/page-fbdfe8ede86c43ce.js`,
      `${BASE_PATH}/_next/static/chunks/app/price-check/page-7c28b0048cba184b.js`,
      `${BASE_PATH}/_next/static/chunks/app/receive/page-790ab52e8241ac1f.js`,
      `${BASE_PATH}/_next/static/chunks/app/receive/page-ee74d62e9c3d1d24.js`,
      `${BASE_PATH}/_next/static/chunks/app/stock/page-2f193d9b59c9e421.js`,
      `${BASE_PATH}/_next/static/chunks/app/stock/page-3cdd7eea61b8daa1.js`,
      `${BASE_PATH}/_next/static/chunks/app/transfer/page-ba9452abe9f64878.js`,
      `${BASE_PATH}/_next/static/chunks/app/transfer/page-a25d77e1689ba8c4.js`,
      `${BASE_PATH}/_next/static/chunks/e34aaff9-9d0e4ab542d5999d.js`,
      `${BASE_PATH}/_next/static/chunks/ee560e2c-8a73055faacac193.js`,
      `${BASE_PATH}/_next/static/chunks/main-app-93e4dceeac7d2a79.js`,
      `${BASE_PATH}/_next/static/chunks/webpack-9fe7c363585b0767.js`,
      `${BASE_PATH}/_next/static/css/7d5e323db8624040.css`,
      `${BASE_PATH}/_next/static/chunks/_app-pages-browser_node_modules_next_dist_client_dev_noop-turbopack-hmr_js.js`,
      `${BASE_PATH}/_next/static/chunks/app-pages-internals.js`,
      `${BASE_PATH}/_next/static/chunks/app/layout.js`,
      `${BASE_PATH}/_next/static/chunks/app/login/page.js`,
      `${BASE_PATH}/_next/static/chunks/app/main/page.js`,
      `${BASE_PATH}/_next/static/chunks/app/page.js`,
      `${BASE_PATH}/_next/static/chunks/app/price-check/page.js`,
      `${BASE_PATH}/_next/static/chunks/app/receive/page.js`,
      `${BASE_PATH}/_next/static/chunks/app/stock/page.js`,
      `${BASE_PATH}/_next/static/chunks/app/transfer/page.js`,
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