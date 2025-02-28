"use client";
import "./globals.css";
import { useState } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // ดึง URL ปัจจุบัน
  const hideSidebarPages = ["/login"]; // หน้าที่ไม่ต้องการให้แสดง Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // สถานะการเปิด-ปิดของ Sidebar

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
            {/* แสดง Sidebar เฉพาะหน้าที่ไม่ใช่ /login */}
            {!hideSidebarPages.includes(pathname) && (
              <div className={`fixed h-full transition-width duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            )}

            {/* เนื้อหาหลักของแต่ละหน้า */}
            <main className="flex-1 transition-margin duration-300" style={{ marginLeft: hideSidebarPages.includes(pathname) ? 0 : isSidebarOpen ? '16rem' : '4rem' }}>
              {children}
            </main>
          </div>
          <NetworkStatus />
        </NetworkStatusProvider>
      </body>
    </html>
  );
}