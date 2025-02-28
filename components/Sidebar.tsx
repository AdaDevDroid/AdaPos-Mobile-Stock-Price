"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaBoxOpen, FaExchangeAlt, FaClipboardCheck, FaTags, FaSignOutAlt, FaBars } from "react-icons/fa";

const menuItems = [
    { name: "หน้าหลัก", icon: <FaHome />, path: "/main" },
    { name: "รับสินค้าจากผู้จำหน่าย", icon: <FaBoxOpen />, path: "/receive" },
    { name: "รับโอนระหว่างสาขา", icon: <FaExchangeAlt />, path: "/transfer" },
    { name: "ตรวจนับสต็อก", icon: <FaClipboardCheck />, path: "/stock" },
    { name: "ตรวจสอบราคา/โปรโมชั่น", icon: <FaTags />, path: "/scan" },
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const router = useRouter();

    const handleLogout = async () => {
        console.log("logout");
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
    };

    return (
        <div className={`h-screen bg-white shadow-md text-white whitespace-nowrap ${isOpen ? "w-100" : "w-15"} transition-all duration-300`}>
            {/* ปุ่มเปิด-ปิด */}
            <div className="flex p-4 bg-blue-600 justify-between items-center">
                <span className={`text-l font-bold ${!isOpen && "hidden"}`}>AdaPos+ Stock & Price</span>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white">
                    <FaBars
                    className={`${isOpen ? "ms-4" : "ms-0"}`}
                    size={24} />
                </button>
            </div>

            {/* เมนู */}
            <nav className="mt-1">
  {menuItems.map((item, index) => (
    <div
      key={index}
      onClick={() => router.push(item.path)}
      className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 transition-all duration-200`}
    >
      {/* ไอคอน */}
      <span className={`text-gray-700 hover:text-gray-800 transition-all duration-200
        ${isOpen ? "text-[20px]" : "text-[30px]"}`}>
        {item.icon}
      </span>

      {/* ชื่อเมนู */}
      <span
        className={`text-gray-700 transition-all duration-200 ps-2 whitespace-nowrap
        ${!isOpen && "hidden"}`}
      >
        {item.name}
      </span>
    </div>
  ))}
</nav>

            {/* ปุ่มออกจากระบบ */}
            <div
                onClick={handleLogout}
                className="absolute bottom-4 left-4 flex items-center gap-3 cursor-pointer rounded-md"
            >
                <FaSignOutAlt className="text-gray-700 hover:text-red-700 text-[30px]" />
                <span className={`${!isOpen && "hidden"} transition-all text-gray-700 duration-200`}>ออกจากระบบ</span>
            </div>
        </div>
    );
}