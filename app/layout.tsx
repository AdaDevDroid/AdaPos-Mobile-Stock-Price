"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import AppUpdate from "@/components/AppUpdate";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NameCompany from "@/components/NameCompany";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import {
  C_GETtActiveBasePath,
  C_GETtBasePathFromPathname,
  C_GETtPartStorageValue,
  C_GETtRoutePathFromPathname,
  C_SETxPartStorageValue,
  SIDEBAR_STORAGE_KEY,
} from "@/hooks/CDatabaseSettings";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routePath = C_GETtRoutePathFromPathname(pathname);
  const pathBasePath = C_GETtBasePathFromPathname(pathname);
  const showNavPages = ["/main", "/receive", "/transfer", "/stock", "/price-check"];
  const shouldShowNav = showNavPages.includes(routePath);
  const isSettingPage = routePath === "/setting";

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);
  const [activeBasePath, setActiveBasePath] = useState(pathBasePath);

  useEffect(() => {
    const nextBasePath = C_GETtActiveBasePath();
    setActiveBasePath(nextBasePath);
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `${nextBasePath}/manifest.json`);
    document.querySelector('link[rel="icon"]')?.setAttribute("href", `${nextBasePath}/favicon.ico`);

  }, [pathBasePath]);

  useEffect(() => {
    const storedValue = C_GETtPartStorageValue(SIDEBAR_STORAGE_KEY);
    if (storedValue === null && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(storedValue === "true");
    }
  }, [pathBasePath]);

  useEffect(() => {
    if (isSidebarOpen !== null) {
      C_SETxPartStorageValue(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen, pathBasePath]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href={`${activeBasePath}/manifest.json`} />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href={`${activeBasePath}/favicon.ico`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <NetworkStatusProvider>
          <AppUpdate basePath={pathBasePath} disabled={isSettingPage} />
          <div id="app-content" className="relative min-h-screen md:flex">
            {/* Mobile Header */}
            {shouldShowNav && <MobileHeader />}

            {/* Sidebar for Desktop */}
            {shouldShowNav && isSidebarOpen !== null && (
              <div className="hidden md:block">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            )}

            {/* Main Content */}
            <main className={`flex-1 ${shouldShowNav ? 'pt-16 md:pt-0 pb-20 md:pb-0' : ''}`}>
              <div className={`h-full ${isSettingPage ? "p-0" : "p-4 md:p-6"}`}>
                {children}
              </div>
            </main>

            {/* Bottom Navigation for Mobile */}
            {shouldShowNav && <BottomNav />}

             {/* Company Name (Desktop) & Network Status */}
             <div className="fixed bottom-0 left-0 right-0 md:right-auto md:left-auto p-4 flex justify-between items-center md:justify-start pointer-events-none">
                {shouldShowNav && (
                    // ---- จุดที่แก้ไข ----
                    // เพิ่มคลาส hidden md:block เพื่อซ่อนในโหมดมือถือ
                    <div className={`hidden md:block pointer-events-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'} mb-16 md:mb-0`}>
                        <NameCompany />
                    </div>
                )}
            </div>
            <NetworkStatus updatesDisabled={isSettingPage} />
          </div>
        </NetworkStatusProvider>
      </body>
    </html>
  );
}
