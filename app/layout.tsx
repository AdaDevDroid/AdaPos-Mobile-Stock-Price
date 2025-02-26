"use client";
import "./globals.css";
import { NetworkStatusProvider } from "@/hooks/NetworkStatusContext";
import NetworkStatus from "@/components/NetworkStatus";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // ดึง URL ปัจจุบัน
  const hideSidebarPages = ["/login"]; // หน้าที่ไม่ต้องการให้แสดง Sidebar

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
            {!hideSidebarPages.includes(pathname) && <Sidebar />}

            {/* เนื้อหาหลักของแต่ละหน้า */}
            <main className="flex-1">{children}</main>
          </div>
          <NetworkStatus />
        </NetworkStatusProvider>
      </body>
    </html>
  );
}