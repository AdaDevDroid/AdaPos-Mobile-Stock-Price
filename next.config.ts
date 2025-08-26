import withPWA from "next-pwa";
import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/AdaCheckStockSTD';

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true, // ทำให้สามารถไปหน้าอื่นได้แบบ Offline
  disable: false, 
  buildExcludes: [/middleware-manifest\.json$/], // เพื่อป้องกัน warning ใหม่ของ next-pwa
  publicExcludes: ['!**/robots.txt', '!**/sitemap.xml'], // สำหรับ PWA ที่ใช้ basePath
  scope: basePath,
  sw: `${basePath}/sw.js`,
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  basePath: basePath,// ✅ เพิ่ม basePath เพื่อให้ Next.js ทำงานใน /AdaCheckStockSTD
  assetPrefix: basePath, // ✅ เพิ่ม assetPrefix เพื่อให้ Next.js ทำงานใน /AdaCheckStockSTD
  images: {
    path: `${basePath}/_next/image`,
  },
  // output: 'standalone', // ปิดใช้งาน standalone mode
  ...pwaConfig,
  webpack: (config, { dev }) => {
    if (dev) {
      config.devServer = config.devServer || {};
      config.devServer.client = {
        overlay: false, // 🔥 ปิด Error Overlay ของ Webpack
      };
    }

    config.output = config.output || {};
    config.output.publicPath = `${basePath}/_next/`;

    return config;
  },
};

export default nextConfig;