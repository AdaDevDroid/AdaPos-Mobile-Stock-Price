module.exports = {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/test\.com\/.*/, // ใส่โดเมนของคุณ
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages",
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }, // Cache 7 วัน
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/, // Cache รูปภาพ
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }, // Cache 30 วัน
        },
      },
      {
        urlPattern: /\.(?:js|css|woff2|json)$/, // Cache ไฟล์ JS, CSS, Fonts
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  };