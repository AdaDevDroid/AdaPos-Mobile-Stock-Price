// Type definitions for next-pwa
declare module "next-pwa" {
  import { NextConfig } from "next";
  
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    cacheOnFrontEndNav?: boolean;
    disable?: boolean;
    buildExcludes?: (string | RegExp)[];
    publicExcludes?: string[];
    scope?: string;
    sw?: string;
    [key: string]: any;
  }
  
  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
