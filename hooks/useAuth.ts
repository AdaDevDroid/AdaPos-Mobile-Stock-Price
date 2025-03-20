"use client";
import { useEffect } from "react";

export function useAuth() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        
          const cachedToken = localStorage.getItem("session_token");
          if (!cachedToken) {
            console.error("❌ ไม่มี Token ใน Cache, Redirect ไปหน้า Login");
            window.location.href = "/";
            return;
          }

          console.log("✅ ใช้ Token ล่าสุดจาก LocalStorage");
          return;

      } catch (error) {
        console.error("⚠️ Error เช็คสิทธิ์:", error);
        window.location.href = "/";
      }
    };

    checkAuth();
  }, []);
}