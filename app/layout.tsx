"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NameCompany from "@/components/NameCompany";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebarPages = ["/main", "/receive", "/transfer", "/stock", "/price-check"];

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
      console.log = () => { };
      console.warn = () => { };
      console.error = () => { };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        // .register("/sw.js")
        .register(`${process.env.NEXT_PUBLIC_BASE_PATH}/sw.js`)
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
    const storedValue = localStorage.getItem("sidebarOpen");
    setIsSidebarOpen(storedValue ? JSON.parse(storedValue) : false);
  }, []);

  useEffect(() => {
    if (isSidebarOpen !== null) {
      localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH}/favicon.ico`} />
      </head>
      <body>
        <NetworkStatusProvider>
          <div className="flex h-screen relative">
            {showSidebarPages.includes(pathname) && isSidebarOpen !== null && (
              <div className={`fixed h-full transition-width duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'} z-10`}>
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            )}

            <main
              className="flex-1 transition-margin duration-300"
              style={{
                marginLeft: showSidebarPages.includes(pathname) && isSidebarOpen !== null
                  ? (isSidebarOpen ? '16rem' : '4rem')
                  : 0
              }}
            >
              {children}
            </main>

            {/* ใช้ margin-left เพื่อให้ NameCompany ขยับตาม Sidebar */}
            {showSidebarPages.includes(pathname) && (
              <div
                className="fixed bottom-2 left-2 z-20 bg-white"
                style={{
                  marginLeft: isSidebarOpen !== null
                    ? (isSidebarOpen ? '16rem' : '4rem')
                    : 0
                }}
              >
                <NameCompany />
              </div>
            )}
          </div>
          <NetworkStatus />
        </NetworkStatusProvider>
      </body>
    </html>
  );
}