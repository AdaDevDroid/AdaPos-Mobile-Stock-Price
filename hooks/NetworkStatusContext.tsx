"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { C_GETtPartUrl } from "@/hooks/CDatabaseSettings";

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
          // เพิ่ม timeout เพื่อป้องกันการค้าง
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(C_GETtPartUrl("/test-network.ts"), {
            method: "HEAD", 
            cache: "no-store",
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          onlineStatus = response.ok;
        } catch (error) {
          console.log("🔴 Network check failed:", error);
          onlineStatus = false;
        }
      }

      setIsOnline(onlineStatus);
    };

    const updateOnlineStatus = () => {
      console.log("🌐 Network status changed:", navigator.onLine ? "Online" : "Offline");
      setIsOnline(navigator.onLine);
      checkOnlineStatus(); // เช็คซ้ำให้แน่ใจ
    };

    // ✅ เช็คสถานะทุก 10 วินาทีแทน 5 วินาที เพื่อลดโหลด
    const interval = setInterval(checkOnlineStatus, 10000);

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
