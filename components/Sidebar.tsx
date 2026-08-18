"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaHome, FaBoxOpen, FaExchangeAlt, FaClipboardCheck, FaTags, FaBars, FaSignOutAlt } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_GETxUserData } from "@/hooks/CIndexedDB";
import { C_CLRxPartSession, C_GETtPartUrl, C_GETtRoutePathFromPathname, C_REMxPartStorageValue, SIDEBAR_STORAGE_KEY } from "@/hooks/CDatabaseSettings";

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
  const pathname = usePathname();
  const routePath = C_GETtRoutePathFromPathname(pathname);
  const [tUrlImg, setUrlImg] = useState("");

  useEffect(() => {
    const openDB = async () => {
      const db = await C_PRCxOpenIndexedDB();
      const oUserData = await C_GETxUserData(db);
      setUrlImg(oUserData?.FTImgObj ?? "");
    };
    openDB();
  }, []);

  const handleLogout = async () => {
    try {
      C_CLRxPartSession();
      C_REMxPartStorageValue(SIDEBAR_STORAGE_KEY);
      console.log("✅ Logout สำเร็จ");
    } catch (error) {
      console.log("❌ ไม่สามารถ Logout:", error);
    }
    window.location.href = C_GETtPartUrl("/login");
  };

  return (
    // ✅ ใช้ flex-col และ h-full เพื่อให้ layout ยืดเต็มความสูง
    <div className={`h-full hidden md:flex flex-col bg-white shadow-md text-white whitespace-nowrap ${isOpen ? "w-64" : "w-16"} transition-all duration-300`}>
      {/* Header section */}
      <div className={`flex items-center p-4 ${isOpen ? "bg-blue-600 justify-between" : "bg-white justify-center"}`}>
        {isOpen && (
          <span className="text-l font-bold">AdaPos+ Stock & Price</span>
        )}
        <button onClick={toggleSidebar} className="text-white">
          {isOpen ? (
            <FaBars size={24} />
          ) : (
            <img
              src={tUrlImg && tUrlImg !== "" ? tUrlImg : C_GETtPartUrl("/icons/logoAda.png")}
              alt="Logo"
              className="w-8 h-8"
            />
          )}
        </button>
      </div>

      {/* Menu - ใช้ flex-grow เพื่อดันปุ่ม Logout ไปด้านล่าง */}
      <nav className="mt-2 flex-grow">
        {menuItems.map((item) => {
          const isActive = routePath === item.path;
          return (
            <div
              key={item.name}
              onClick={() => { window.location.href = C_GETtPartUrl(item.path); }}
              className={`flex items-center cursor-pointer transition-colors duration-200 
                ${isOpen ? "p-4 justify-start" : "p-4 justify-center"}
                ${isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}
            >
              <span title={isOpen ? "" : item.name} className="transition-all duration-200 text-[28px]">
                {item.icon}
              </span>
              <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${!isOpen ? "opacity-0 hidden" : "opacity-100"}`}>
                {item.name}
              </span>
            </div>
          );
        })}
      </nav>

      {/* 🔥 ปุ่ม Logout สำหรับ Desktop - นำกลับมาไว้ที่นี่ */}
      <div
        onClick={handleLogout}
        className={`flex items-center cursor-pointer transition-colors duration-200 text-gray-700 hover:bg-gray-100
          ${isOpen ? "p-4 justify-start" : "p-4 justify-center"}`}
      >
        <span title={isOpen ? "" : "ออกจากระบบ"} className="transition-all duration-200 text-[28px]">
          <FaSignOutAlt />
        </span>
        <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${!isOpen ? "opacity-0 hidden" : "opacity-100"}`}>
          ออกจากระบบ
        </span>
      </div>
    </div>
  );
}
