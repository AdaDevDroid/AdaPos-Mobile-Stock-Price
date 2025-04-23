// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

const VERSION = "1.0.12"
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

  async function updateStatic() {
    const cache = await caches.open('static-resources');
    const urls = [
      '/_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_49a6ea35._.js',
      '/_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_5160d576._.js',
      '/_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_61dcf9ba._.js',
      '/_next/static/chunks/_1a8fb61d._.js',
      '/_next/static/chunks/_723fa7e6._.js',
      '/_next/static/chunks/_797ea879._.js',
      '/_next/static/chunks/_83a281bb._.js',
      '/_next/static/chunks/_be317ff2._.js',
      '/_next/static/chunks/_c6584716._.js',
      '/_next/static/chunks/_ca031bef._.js',
      '/_next/static/chunks/_e69f0d32._.js',
      '/_next/static/chunks/_f6cf4364._.js',
      '/_next/static/chunks/app_globals_73c37791.css',
      '/_next/static/chunks/app_layout_tsx_f0e4c1a2._.js',
      '/_next/static/chunks/app_login_page_tsx_5315b68d._.js',
      '/_next/static/chunks/app_main_page_tsx_5315b68d._.js',
      '/_next/static/chunks/app_page_tsx_5315b68d._.js',
      '/_next/static/chunks/app_page_tsx_8221feda._.js',
      '/_next/static/chunks/app_price-check_page_tsx_5315b68d._.js',
      '/_next/static/chunks/app_receive_page_tsx_5315b68d._.js',
      '/_next/static/chunks/app_stock_page_tsx_5315b68d._.js',
      '/_next/static/chunks/app_transfer_page_tsx_5315b68d._.js',
      '/_next/static/chunks/node_modules_%40swc_helpers_cjs_00636ac3._.js',
      '/_next/static/chunks/node_modules_1c03786c._.js',
      '/_next/static/chunks/node_modules_html5-qrcode_esm_62b22b9a._.js',
      '/_next/static/chunks/node_modules_html5-qrcode_third_party_zxing-js_umd_df022588.js',
      '/_next/static/chunks/node_modules_lucide-react_dist_esm_5422ca27._.js',
      '/_next/static/chunks/node_modules_next_6537e83d._.js',
      '/_next/static/chunks/node_modules_next_dist_3bfaed20._.js',
      '/_next/static/chunks/node_modules_next_dist_5ed72bed._.js',
      '/_next/static/chunks/node_modules_next_dist_client_43e3ffb8._.js',
      '/_next/static/chunks/node_modules_next_dist_compiled_2ce9398a._.js',
      '/_next/static/chunks/node_modules_next_dist_compiled_483ce580._.js',
      '/_next/static/chunks/node_modules_next_dist_compiled_buffer_index_feebad72.js',
      '/_next/static/chunks/node_modules_next_dist_compiled_crypto-browserify_index_07270ec0.js',
      '/_next/static/chunks/node_modules_next_image_11ac1673.js',
      '/_next/static/chunks/node_modules_react-icons_ci_index_mjs_e4544c82._.js',
      '/_next/static/chunks/node_modules_react-icons_fa_index_mjs_d2e2d7f5._.js',
      '/_next/static/chunks/node_modules_react-icons_fi_index_mjs_9cbf4bb1._.js',
      '/_next/static/chunks/node_modules_react-icons_lib_74ccc930._.js',
      '/_next/static/chunks/node_modules_xlsx_xlsx_mjs_ad755052._.js'
    ];

    await Promise.all(
      urls.map(url =>
        fetch(url).then(response => {
          if (response.ok) return cache.put(url, response.clone());
          else console.warn('❌ โหลดไม่ได้:', url);
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