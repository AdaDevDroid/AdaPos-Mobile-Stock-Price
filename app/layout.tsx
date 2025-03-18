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

  // 🔥 ใช้ useState โดยให้ค่าเริ่มต้นเป็น `null` แล้วใช้ useEffect โหลดค่าจาก localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    // ✅ โหลดค่าจาก localStorage หลังจาก component mount
    const storedValue = localStorage.getItem("sidebarOpen");
    setIsSidebarOpen(storedValue === "false" ? false : true);
  }, []);

  useEffect(() => {
    // ✅ อัปเดต localStorage เมื่อค่าของ isSidebarOpen เปลี่ยนแปลง
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
            {/* แสดง Sidebar เฉพาะหน้าที่กำหนด */}
            {showSidebarPages.includes(pathname) && isSidebarOpen !== null && (
              <div className={`fixed h-full transition-width duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              </div>
            )}

            {/* เนื้อหาหลักของแต่ละหน้า */}
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