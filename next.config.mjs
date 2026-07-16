const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD";

const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  outputFileTracingRoot: process.cwd(),
  basePath,
  assetPrefix: basePath,
  images: {
    path: `${basePath}/_next/image`,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devServer = config.devServer || {};
      config.devServer.client = {
        overlay: false,
      };
    }

    config.output = config.output || {};
    config.output.publicPath = `${basePath}/_next/`;

    return config;
  },
};

export default nextConfig;
