"use client";
import "./globals.css";
import { useState, useEffect } from "react";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // ดึง URL ปัจจุบัน
  const hideSidebarPages = ["/login"]; // หน้าที่ไม่ต้องการให้แสดง Sidebar

  // โหลดค่าจาก localStorage หรือใช้ค่าเริ่มต้น
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ดึงค่าจาก localStorage ตอนเปิดหน้าใหม่
  useEffect(() => {
    const savedState = localStorage.getItem("isSidebarOpen");
    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    }
  }, []);

  // บันทึกค่าไว้ใน localStorage เมื่อมีการเปลี่ยนค่า
  useEffect(() => {
    localStorage.setItem("isSidebarOpen", String(isSidebarOpen));
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