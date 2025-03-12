"use client";
import { createContext, useContext, useEffect, useState } from "react";

// ✅ สร้าง Context
const NetworkStatusContext = createContext<boolean>(false);

// ✅ สร้าง Provider
export const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(false); // ค่าเริ่มต้นเป็น false

  useEffect(() => {
    // ✅ ฟังก์ชันตรวจสอบสถานะอินเทอร์เน็ต
    const checkOnlineStatus = async () => {
      try {
        const response = await fetch("/test-network.txt", { cache: "no-store" });
        setIsOnline(response.ok); // ถ้า fetch ผ่าน แสดงว่าออนไลน์
      } catch (error) {
        setIsOnline(false); // ถ้า fetch ไม่ผ่าน แสดงว่าออฟไลน์
      }
    };

    // ✅ ตั้งค่าค่าเริ่มต้นตาม navigator.onLine
    setIsOnline(navigator.onLine);
    
    // ✅ ตรวจสอบเน็ตด้วย fetch() อีกครั้ง เผื่อ navigator.onLine ไม่แม่นยำ
    checkOnlineStatus();

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      checkOnlineStatus(); // เช็คซ้ำเผื่อ navigator.onLine ไม่ตรง
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={isOnline}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

// ✅ สร้าง Custom Hook
export const useNetworkStatus = () => useContext(NetworkStatusContext);