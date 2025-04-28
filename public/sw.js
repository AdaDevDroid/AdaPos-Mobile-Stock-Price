// นำเข้า Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

const VERSION = "1.0.12";
const BASE_PATH = '/AdaCheckStockSTD';

// ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ
console.log('ตรวจสอบว่า Workbox ถูกโหลดสำเร็จ');
if (workbox) {
  console.log('Workbox is loaded 🎉')

  updateCache();

  // ฟังก์ชั่นในการอัพเดต cache หรือทำบางอย่าง
  function updateCache() {
    updateStatic();
    // เก็บ VERSION ใหม่ใน cache
    caches.open(workbox.core.cacheName).then((cache) => {
      cache.put(`${BASE_PATH}/`, new Response(VERSION));
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
      '_1a8fb61d._.js',
      '_723fa7e6._.js',
      '_797ea879._.js',
      '_83a281bb._.js',
      '_be317ff2._.js',
      '_c6584716._.js',
      '_ca031bef._.js',
      '_e69f0d32._.js',
      '_f6cf4364._.js',
      'app_globals_73c37791.css',
      'app_layout_tsx_f0e4c1a2._.js',
      'app_login_page_tsx_5315b68d._.js',
      'app_main_page_tsx_5315b68d._.js',
      'app_page_tsx_5315b68d._.js',
      'app_page_tsx_8221feda._.js',
      'app_price-check_page_tsx_5315b68d._.js',
      'app_receive_page_tsx_5315b68d._.js',
      'app_stock_page_tsx_5315b68d._.js',
      'app_transfer_page_tsx_5315b68d._.js',
      'node_modules_%40swc_helpers_cjs_00636ac3._.js',
      'node_modules_1c03786c._.js',
      'node_modules_html5-qrcode_esm_62b22b9a._.js',
      'node_modules_html5-qrcode_third_party_zxing-js_umd_df022588.js',
      'node_modules_lucide-react_dist_esm_5422ca27._.js',
      'node_modules_next_6537e83d._.js',
      'node_modules_next_dist_3bfaed20._.js',
      'node_modules_next_dist_5ed72bed._.js',
      'node_modules_next_dist_client_43e3ffb8._.js',
      'node_modules_next_dist_compiled_2ce9398a._.js',
      'node_modules_next_dist_compiled_483ce580._.js',
      'node_modules_next_dist_compiled_buffer_index_feebad72.js',
      'node_modules_next_dist_compiled_crypto-browserify_index_07270ec0.js',
      'node_modules_next_image_11ac1673.js',
      'node_modules_react-icons_ci_index_mjs_e4544c82._.js',
      'node_modules_react-icons_fa_index_mjs_d2e2d7f5._.js',
      'node_modules_react-icons_fi_index_mjs_9cbf4bb1._.js',
      'node_modules_react-icons_lib_74ccc930._.js',
      'node_modules_xlsx_xlsx_mjs_ad755052._.js'
    ].map(url => `${BASE_PATH}/_next/static/chunks/${url}`); // Fixed path concatenation

    await Promise.all(
      urls.map(url =>
        fetch(url).then(response => {
          if (response.ok) return cache.put(url, response.clone());
          else console.warn('❌ โหลดไม่ได้:', url);
        }).catch(err => console.warn('❌ fetch error:', url, err))
      )
    );

    console.log('✅ preload static-resources เสร็จเรียบร้อย!');
  }

  // ปรับปรุง routing เพื่อรองรับ subdirectory
  workbox.routing.registerRoute(
    ({ url }) => {
      const path = url.pathname;
      return path.startsWith(BASE_PATH) && (
        path.endsWith('.js') ||
        path.endsWith('.css') ||
        path.endsWith('.png') ||
        path.endsWith('.jpg') ||
        path.endsWith('.jpeg') ||
        path.includes('/_next/') ||
        ['/login', '/main', '/receive', '/transfer', '/stock', '/price-check'].some(route => 
          path === BASE_PATH + route || path === BASE_PATH + route + '/'
        )
      );
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );
} else {
  console.log('Workbox failed to load 😢');
}