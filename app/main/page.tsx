"use client";
import { C_PRCxOpenIndexedDB, C_INSxUserToDB } from "@/hooks/CIndexedDB";
import { useAuth } from "@/hooks/useAuth";

import { useState, useEffect } from "react";

export default function MainPage() {
  // เช็ค user login
  useAuth();
  
  const [oDb, setDB] = useState<IDBDatabase | null>(null);

  // เปิดฐานข้อมูล
  useEffect(() => {
    const initDB = async () => {
      const database = await C_PRCxOpenIndexedDB();
      setDB(database);
    };
    initDB();
  }, []);

  // ฟังก์ชันเพิ่มข้อมูลลง IndexedDB
  const handleInsertUser = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }

    const newUser = {
      FTUsrCode: "U123",
      FTUsrLogin: "user123",
      FTUsrPass: "password123",
      FTUsrName: "John Doe",
      FTBchCode: "BCH001",
      FTAgnCode: "AGN001",
      FTMerCode: "MER001",
    };

    try {
      await C_INSxUserToDB(oDb, newUser);
      alert("✅ เพิ่มข้อมูลสำเร็จ");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <h3 className="text-2xl mt-4">MainPage</h3>
        <p className="text-gray-500">เข้าสู่หน้า MainPage</p>
      </div>

      {/* ปุ่ม Insert ข้อมูล */}
      <button
        className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-green-600"
        onClick={handleInsertUser}
      >
        Insert ข้อมูล
      </button>
    </div>
  );
}
