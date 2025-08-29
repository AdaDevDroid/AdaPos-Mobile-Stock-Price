"use client";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_GETxUserData } from "@/hooks/CIndexedDB";
import { UserInfo } from "@/models/models";

export default function MobileHeader() {
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const db = await C_PRCxOpenIndexedDB();
        const userData = await C_GETxUserData(db);
        setUserInfo(userData);
      } catch (error) {
        console.error("Failed to fetch user data for header:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_expiry");
      localStorage.removeItem("sidebarOpen");
      console.log("✅ Logout สำเร็จ");
    } catch (error) {
      console.log("❌ ไม่สามารถ Logout:", error);
    }
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`;
  };

  return (
    // Header ที่จะแสดงเฉพาะบนมือถือ (md:hidden)
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-20 md:hidden">
      {/* User and Branch Name */}
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-800">{oUserInfo?.FTUsrName}</p>
        <p className="text-xs text-gray-500">{oUserInfo?.FTBchName}</p>
      </div>
      
      {/* Logout Button */}
      <div className="flex items-center">
        <button
          onClick={handleLogout}
          className="text-gray-600 hover:text-blue-600"
          title="ออกจากระบบ"
        >
          <FaSignOutAlt size={24} />
        </button>
      </div>
    </header>
  );
}