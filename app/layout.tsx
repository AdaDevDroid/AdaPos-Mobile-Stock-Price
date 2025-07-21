"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NameCompany from "@/components/NameCompany";
import BottomNav from "@/components/BottomNav"; // 1. Import BottomNav

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavPages = ["/main", "/receive", "/transfer", "/stock", "/price-check"];
  const shouldShowNav = showNavPages.includes(pathname);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  // useEffect for Service Worker registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sw.js`)
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }
  }, []);

  // useEffect to load sidebar state from localStorage
  useEffect(() => {
    const storedValue = localStorage.getItem("sidebarOpen");
    setIsSidebarOpen(storedValue ? JSON.parse(storedValue) : false);
  }, []);

  // useEffect to save sidebar state to localStorage
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
          <div className="flex h-screen bg-gray-50">
            {/* 2. Sidebar for Desktop: Hidden on mobile */}
            {shouldShowNav && isSidebarOpen !== null && (
               <div className="hidden md:block">
                 <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
               </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
              <main
                className={`flex-1 overflow-y-auto transition-all duration-300 
                  ${shouldShowNav ? 'pb-24 md:pb-4' : ''}
                  ${shouldShowNav && isSidebarOpen ? 'md:ml-64' : ''}
                  ${shouldShowNav && !isSidebarOpen ? 'md:ml-16' : ''}
                `}
              >
                {children}
              </main>
            </div>

            {/* 3. Bottom Navigation for Mobile */}
            {shouldShowNav && <BottomNav />}

            {/* Company Name Display */}
            {shouldShowNav && (
               <div className={`fixed z-10 bg-white p-2 rounded-md shadow-sm
                  md:bottom-2 
                  bottom-20 left-4 md:left-auto
                  ${isSidebarOpen ? 'md:left-64' : 'md:left-16'}
                  transition-all duration-300`}
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
