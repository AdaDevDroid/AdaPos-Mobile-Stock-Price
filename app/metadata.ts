import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AdaPos+ Stock & Price",
    description: "AdaPos+ Stock & Price",
    themeColor: "#000000",
    icons: {
      // icon: "/icons/icon-192x192.png",
      // apple: "/icons/apple-touch-icon.png",
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/icons/icon-192x192.png`,
      apple: `${process.env.NEXT_PUBLIC_BASE_PATH}/icons/apple-touch-icon.png`,
    },
    manifest: `${process.env.NEXT_PUBLIC_BASE_PATH}/manifest.json`,
  };