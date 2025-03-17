"use client";
import { useEffect } from "react";
import { useNetworkStatus } from "./NetworkStatusContext";

export function useAuth() {
  const isOnline = useNetworkStatus()
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isOnline) {
          // 🔴 ออฟไลน์ → ใช้ Token จาก LocalStorage
          console.log("🔴 Offline Mode: ใช้ Token จาก LocalStorage");

          const cachedToken = localStorage.getItem("session_token");
          if (!cachedToken) {
            console.error("❌ ไม่มี Token ใน Cache, Redirect ไปหน้า Login");
            window.location.href = "/";
            return;
          }

          console.log("✅ ใช้ Token ล่าสุดจาก LocalStorage");
          return;
        }

        // ✅ กรณีออนไลน์ → เช็คสิทธิ์จาก Cookie
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        console.log("📢 Auth Response:", data); 

        if (!data.authenticated) {
          console.log("❌ ยังไม่ login, Redirect ไปหน้า Login");
          window.location.href = "/";
        } else {
          console.log("✅ login แล้ว");
        }
      } catch (error) {
        console.error("⚠️ Error เช็คสิทธิ์:", error);
        window.location.href = "/";
      }
    };

    checkAuth();
  }, []);
}