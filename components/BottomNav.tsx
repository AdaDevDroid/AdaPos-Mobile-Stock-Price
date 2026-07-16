"use client";
import { usePathname } from "next/navigation";
import { FaHome, FaBoxOpen, FaExchangeAlt, FaClipboardCheck, FaTags } from "react-icons/fa";
import { C_GETtPartUrl, C_GETtRoutePathFromPathname } from "@/hooks/CDatabaseSettings";

// ✅ นำ menuItems มาใช้ร่วมกัน
const menuItems = [
  { name: "หน้าหลัก", icon: <FaHome />, path: "/main" },
  { name: "รับสินค้า", icon: <FaBoxOpen />, path: "/receive" },
  { name: "รับโอน", icon: <FaExchangeAlt />, path: "/transfer" },
  { name: "ตรวจนับ", icon: <FaClipboardCheck />, path: "/stock" },
  { name: "ราคา", icon: <FaTags />, path: "/price-check" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const routePath = C_GETtRoutePathFromPathname(pathname);

  return (
    //  ✅ แสดงเฉพาะจอมือถือ (md:hidden) และยึดตำแหน่งไว้ด้านล่าง (fixed bottom-0)
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] md:hidden z-20">
      <div className="flex justify-around items-center h-16">
        {menuItems.map((item) => {
          const isActive = routePath === item.path;
          return (
            <button
              key={item.name}
              onClick={() => { window.location.href = C_GETtPartUrl(item.path); }}
              className={`flex flex-col items-center justify-center space-y-1 w-full ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
