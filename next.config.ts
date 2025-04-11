import withPWA from "next-pwa";
import type { NextConfig } from "next";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true, // ทำให้สามารถไปหน้าอื่นได้แบบ Offline
  disable: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  // basePath: '/AdaCheckStockSTD',// ✅ เพิ่ม basePath เพื่อให้ Next.js ทำงานใน /AdaCheckStockSTD
  basePath: `${process.env.NEXT_PUBLIC_BASE_PATH}`,// ✅ เพิ่ม basePath เพื่อให้ Next.js ทำงานใน /AdaCheckStockSTD
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