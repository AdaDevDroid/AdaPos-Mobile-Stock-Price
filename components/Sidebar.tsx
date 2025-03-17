"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaBoxOpen, FaExchangeAlt, FaClipboardCheck, FaTags, FaSignOutAlt, FaBars } from "react-icons/fa";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";

const menuItems = [
  { name: "หน้าหลัก", icon: <FaHome />, path: "/main" },
  { name: "รับสินค้าจากผู้จำหน่าย", icon: <FaBoxOpen />, path: "/receive" },
  { name: "รับโอนระหว่างสาขา", icon: <FaExchangeAlt />, path: "/transfer" },
  { name: "ตรวจนับสต็อก", icon: <FaClipboardCheck />, path: "/stock" },
  { name: "ตรวจสอบราคา/โปรโมชั่น", icon: <FaTags />, path: "/price-check" },
];

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname(); // ✅ ดึง path ของหน้าปัจจุบัน
  const isNetworkOnline = useNetworkStatus();

  const handleLogout = async () => {
    console.log("logout");

    await caches.delete("my-api-cache-v1").then((success) => {
      if (success) {
        console.log("🗑️ Cache 'my-api-cache-v1' ถูกลบเรียบร้อย");
      } else {
        console.warn("⚠️ ไม่พบ Cache 'my-api-cache-v1' หรือถูกลบไปแล้ว");
      }
    });

    if (isNetworkOnline) {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        console.log("✅ Logout ผ่าน API สำเร็จ");
      } catch (error) {
        console.error("❌ ไม่สามารถเรียก API Logout:", error);
      }
    } else {
      console.warn("⚠️ ไม่มีอินเทอร์เน็ต, เคลียร์ Cookie และลบ Cache");
      document.cookie = "session_token=; path=/; max-age=0;";      
    }

    // 🔄 รีไดเรกต์ออกจากระบบ
    window.location.href = "/";
  };
  return (
    <div className={`h-full bg-white shadow-md text-white whitespace-nowrap ${isOpen ? "w-64" : "w-16"} transition-all duration-300 fixed`}>
      {/* ปุ่มเปิด-ปิด */}
      <div className="flex p-4 bg-blue-600 justify-between items-center">
        <span className={`text-l font-bold ${!isOpen && "hidden"}`}>AdaPos+ Stock & Price</span>
        <button onClick={toggleSidebar} className="text-white">
          <FaBars className={`${isOpen ? "ms-4" : "ms-0"}`} size={24} />
        </button>
      </div>

      {/* เมนู */}
      <nav className="mt-0">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.path; // ✅ เช็คว่าหน้าปัจจุบันตรงกับ path ไหม

          return (
            <div
              key={index}
              onClick={() => router.push(item.path)}
              className={`flex items-center p-4 cursor-pointer transition-all duration-200 
                ${isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}
            >
              {/* ไอคอน */}
              <span className={`transition-all duration-200 ${isOpen ? "text-[20px]" : "text-[30px]"}`}>
                {item.icon}
              </span>

              {/* ชื่อเมนู */}
              <span className={`ps-2 whitespace-nowrap transition-all duration-200 ${!isOpen && "hidden"}`}>
                {item.name}
              </span>
            </div>
          );
        })}
      </nav>

      {/* ปุ่มออกจากระบบ */}
      <div
        onClick={handleLogout}
        className="absolute bottom-4 left-4 flex items-center gap-3 cursor-pointer rounded-md"
      >
        {/* ไอคอน */}
        <span className={`text-gray-700 hover:text-gray-800 transition-all duration-200 ${isOpen ? "text-[20px]" : "text-[30px]"}`}>
          <FaSignOutAlt />
        </span>

        {/* ชื่อเมนู */}
        <span className={`text-gray-700 transition-all duration-200 ps-2 whitespace-nowrap ${!isOpen && "hidden"}`}>
          ออกจากระบบ
        </span>
      </div>
    </div>
  );
}