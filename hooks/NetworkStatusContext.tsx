"use client";
import { createContext, useContext, useEffect, useState } from "react";

// ✅ สร้าง Context สำหรับเช็คอินเทอร์เน็ต
const NetworkStatusContext = createContext<boolean>(true);

// ✅ สร้าง Provider
export const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine); // เช็คสถานะเน็ตเริ่มต้น

    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
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

// ✅ สร้าง Custom Hook เพื่อใช้สถานะเน็ตในทุกหน้า
export const useNetworkStatus = () => useContext(NetworkStatusContext);