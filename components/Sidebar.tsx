"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaBoxOpen, FaExchangeAlt, FaClipboardCheck, FaTags, FaSignOutAlt, FaBars } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_GETxUserData } from "@/hooks/CIndexedDB";

// ✅ ย้าย menuItems มาไว้ข้างนอกเพื่อการจัดการที่ง่ายขึ้น
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
  const pathname = usePathname();
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
      if (localStorage.getItem("session_token")) {
        localStorage.removeItem("session_token");
        localStorage.removeItem("session_expiry");
        localStorage.removeItem("sidebarOpen");
      }
      console.log("✅ Logout สำเร็จ");
    } catch (error) {
      console.log("❌ ไม่สามารถ Logout:", error);
    }
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`;
  };

  return (
    // ✅ เพิ่ม flex flex-col เพื่อให้ item เรียงในแนวตั้ง
    <div className={`h-full hidden md:flex flex-col bg-white shadow-md text-white whitespace-nowrap ${isOpen ? "w-64" : "w-16"} transition-all duration-300`}>
      {/* ส่วนหัวของ Sidebar */}
      <div className={`flex items-center justify-between p-4 ${isOpen ? "bg-blue-600" : "bg-white justify-center"}`}>
        {isOpen && (
          <span className="text-l font-bold">AdaPos+ Stock & Price</span>
        )}
        <button onClick={toggleSidebar} className="text-white">
          {isOpen ? (
            <FaBars size={24} />
          ) : (
            <img
              src={tUrlImg && tUrlImg !== "" ? tUrlImg : `${process.env.NEXT_PUBLIC_BASE_PATH}/icons/logoAda.png`}
              alt="Logo"
              className="w-8 h-8"
            />
          )}
        </button>
      </div>

      {/* เมนู (ปรับปรุงให้ flex-grow เพื่อดัน logout ไปล่างสุด) */}
      <nav className="mt-2 flex-grow">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <div
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`flex items-center cursor-pointer transition-colors duration-200 
                ${isOpen ? "p-4 justify-start" : "p-4 justify-center"}
                ${isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}
            >
              <span title={isOpen ? "" : item.name} className={`transition-all duration-200 ${isOpen ? "text-[28px]" : "text-[28px]"}`}>
                {item.icon}
              </span>
              <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${!isOpen ? "opacity-0 hidden" : "opacity-100"}`}>
                {item.name}
              </span>
            </div>
          );
        })}
      </nav>

      {/* ปุ่มออกจากระบบ */}
      <div
        onClick={handleLogout}
        className={`flex items-center cursor-pointer transition-colors duration-200 text-gray-700 hover:bg-gray-100
          ${isOpen ? "p-4 justify-start" : "p-4 justify-center"}`}
      >
        <span title={isOpen ? "" : "ออกจากระบบ"} className={`transition-all duration-200 ${isOpen ? "text-[24px]" : "text-[28px]"}`}>
          <FaSignOutAlt />
        </span>
        <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${!isOpen ? "opacity-0 hidden" : "opacity-100"}`}>
          ออกจากระบบ
        </span>
      </div>
    </div>
  );
}
