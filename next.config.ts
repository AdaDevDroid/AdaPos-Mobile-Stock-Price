import withPWA from "next-pwa";
import type { NextConfig } from "next";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true, // ทำให้สามารถไปหน้าอื่นได้แบบ Offline
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
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