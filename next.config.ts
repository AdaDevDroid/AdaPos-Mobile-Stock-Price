import withPWA from "next-pwa";
import type { NextConfig } from "next";

const basePath = '/AdaCheckStockSTD';

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true, // ทำให้สามารถไปหน้าอื่นได้แบบ Offline
  disable: false, 
  buildExcludes: [/middleware-manifest\.json$/], // เพื่อป้องกัน warning ใหม่ของ next-pwa
  publicExcludes: ['!**/robots.txt', '!**/sitemap.xml'], // สำหรับ PWA ที่ใช้ basePath
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  basePath: basePath,// ✅ เพิ่ม basePath เพื่อให้ Next.js ทำงานใน /AdaCheckStockSTD
  ...pwaConfig,
  webpack: (config, { dev }) => {
    if (dev) {
      config.devServer = config.devServer || {};
      config.devServer.client = {
        overlay: false, // 🔥 ปิด Error Overlay ของ Webpack
      };
    }
    return config;
  },
};

export default nextConfig;