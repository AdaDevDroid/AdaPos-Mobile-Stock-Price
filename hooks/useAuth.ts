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
            const nowMinutes = Math.floor(Date.now() / 1000 / 60); // แก้ไขการคำนวณให้ถูกต้อง
            console.log(tokenExpiry, nowMinutes)
            
            // ตรวจสอบว่าจะหมดอายุในอีก 30 นาที
            if ((Number(tokenExpiry) - nowMinutes) <= 30) {
              console.log("⚠️ Token จะหมดอายุเร็วๆ นี้ - ต่ออายุ Token อัตโนมัติ");
              const newTokenExpiry = nowMinutes + (24 * 60); // ต่ออายุ 24 ชั่วโมง
              localStorage.setItem("session_expiry", newTokenExpiry.toString());
              console.log("✅ Token ถูกต่ออายุแล้ว");
            }
            
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
    
    // ตรวจสอบ Token ทุก 5 นาที
    const tokenCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);
    
    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, []);
}