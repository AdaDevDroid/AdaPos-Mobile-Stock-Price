"use client";
import { useEffect } from "react";

export function useAuth() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        
          const cachedToken = localStorage.getItem("session_token");
          const tokenExpiry = localStorage.getItem("session_expiry");
          if (!cachedToken) {
            console.log("❌ ไม่มี Token ใน Cache, Redirect ไปหน้า Login");
            // window.location.href = "/";
            window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH}/`;
            return;
          }
          if (tokenExpiry) {
            const nowMinutes = Date.now() / (60 * 1000); // เวลาปัจจุบันเป็น "นาที"
            console.log(tokenExpiry, nowMinutes)
            if (nowMinutes > Number(tokenExpiry)) {
              console.log("❌ Token หมดอายุ → Redirect ไปหน้า Login");
              localStorage.removeItem("session_token");
              localStorage.removeItem("session_expiry");
              // window.location.href = "/";
              window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH}/`;
            }
          }

          console.log("✅ ใช้ Token ล่าสุดจาก LocalStorage");
          return;

      } catch (error) {
        console.log("⚠️ Error เช็คสิทธิ์:", error);
        // window.location.href = "/";
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH}/`;
      }
    };

    checkAuth();
  }, []);
}