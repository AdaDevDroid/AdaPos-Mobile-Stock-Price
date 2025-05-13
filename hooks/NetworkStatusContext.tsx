"use client";
import { createContext, useContext, useEffect, useState } from "react";

// ✅ สร้าง Context
const NetworkStatusContext = createContext<boolean>(true);

export const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const checkOnlineStatus = async () => {
      let onlineStatus = navigator.onLine;

      if (onlineStatus) {
        try {
          // 🔥 เช็คอินเทอร์เน็ตโดยใช้ API ที่เราควบคุมได้
          // const response = await fetch("/test-network.ts", { method: "HEAD", cache: "no-store" });
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}/test-network.ts`, { method: "HEAD", cache: "no-store" });
          onlineStatus = response.ok;
        } catch (error) {
          onlineStatus = false;
        }
      }

      setIsOnline(onlineStatus);
    };

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      checkOnlineStatus(); // เช็คซ้ำให้แน่ใจ
    };

    // ✅ เช็คสถานะทุก 5 วินาทีเผื่ออินเทอร์เน็ตตัดแล้วกลับมา
    const interval = setInterval(checkOnlineStatus, 5000);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    updateOnlineStatus(); // เช็คครั้งแรก

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={isOnline}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

// ✅ Custom Hook
export const useNetworkStatus = () => useContext(NetworkStatusContext);