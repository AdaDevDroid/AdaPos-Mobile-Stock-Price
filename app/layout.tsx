"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebarPages = ["/main", "/receive", "/transfer", "/stock", "/price-check"];

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
    const storedValue = localStorage.getItem("sidebarOpen");
    setIsSidebarOpen(storedValue === "false" ? false : true);
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
      </head>
      <body>
        <NetworkStatusProvider>
          <div className="flex h-screen">
            {showSidebarPages.includes(pathname) && isSidebarOpen !== null && (
              <div className={`fixed h-full transition-width duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            )}

            <main
              className="flex-1 transition-margin duration-300"
              style={{ marginLeft: showSidebarPages.includes(pathname) && isSidebarOpen !== null ? (isSidebarOpen ? '16rem' : '4rem') : 0 }}
            >
              {children}
            </main>
          </div>
          <NetworkStatus />
        </NetworkStatusProvider>
      </body>
    </html>
  );
}