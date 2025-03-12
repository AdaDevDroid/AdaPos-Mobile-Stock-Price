"use client";
import { C_GETxUserData, C_PRCxOpenIndexedDB } from "@/hooks/CIndexedDB";
import { useAuth } from "@/hooks/useAuth";
import { UserInfo } from "@/models/models";
import { useEffect, useState } from "react";

export default function MainPage() {
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // เช็ค user login
  useAuth();

  useEffect(() => {
    const initDB = async () => {
      setIsLoading(true);

      try {
        const database = await C_PRCxOpenIndexedDB();

        // ดึงข้อมูลผู้ใช้หลังจาก oDb ถูกตั้งค่า
        const data = await C_GETxUserData(database);
        if (data) {
          setUserInfo(data);
          console.log("✅ ข้อมูลผู้ใช้ถูกตั้งค่า");
        }
      } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการเปิด IndexedDB", error);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex p-4 justify-between items-center shadow-sm text-gray-500">
        <span className="text-l ml-auto">ชื่อผู้ใช้งาน : {oUserInfo?.FTUsrName} </span>
      </div>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

    </div>
  );
}
