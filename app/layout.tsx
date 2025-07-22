"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NameCompany from "@/components/NameCompany";
import BottomNav from "@/components/BottomNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavPages = ["/main", "/receive", "/transfer", "/stock", "/price-check"];
  const shouldShowNav = showNavPages.includes(pathname);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sw.js`)
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
    const storedValue = localStorage.getItem("sidebarOpen");
    // Default to true on desktop if no value is stored
    if (storedValue === null && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(storedValue ? JSON.parse(storedValue) : false);
    }
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
        <link rel="manifest" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.json`} />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <NetworkStatusProvider>
          <div className="relative min-h-screen md:flex">
            {/* Sidebar for Desktop */}
            {shouldShowNav && isSidebarOpen !== null && (
              <div className="hidden md:block">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            )}

            {/* Main Content */}
            {/* 🔥 แก้ไข: เพิ่ม padding (p-4 md:p-6) เพื่อสร้างระยะห่าง */}
            <main className={`flex-1 p-4 md:p-6 ${shouldShowNav ? 'pb-20 md:pb-6' : ''}`}>
              {children}
            </main>

            {/* Bottom Navigation for Mobile */}
            {shouldShowNav && <BottomNav />}

             {/* Company Name & Network Status */}
             <div className="fixed bottom-0 left-0 right-0 md:right-auto md:left-auto p-4 flex justify-between items-center md:justify-start pointer-events-none">
                {shouldShowNav && (
                    <div className={`pointer-events-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'} mb-16 md:mb-0`}>
                        <NameCompany />
                    </div>
                )}
                <div className="md:fixed md:bottom-4 md:right-4 pointer-events-auto">
                    <NetworkStatus />
                </div>
            </div>
          </div>
        </NetworkStatusProvider>
      </body>
    </html>
  );
}
