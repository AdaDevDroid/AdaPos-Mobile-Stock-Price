"use client";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_GETxUserData } from "@/hooks/CIndexedDB";
import { UserInfo } from "@/models/models";
import { C_CLRxPartSession, C_GETtPartUrl, C_REMxPartStorageValue, SIDEBAR_STORAGE_KEY } from "@/hooks/CDatabaseSettings";

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
      C_CLRxPartSession();
      C_REMxPartStorageValue(SIDEBAR_STORAGE_KEY);
      console.log("✅ Logout สำเร็จ");
    } catch (error) {
      console.log("❌ ไม่สามารถ Logout:", error);
    }
    window.location.href = C_GETtPartUrl("/login");
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
