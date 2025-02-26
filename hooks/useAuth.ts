"use client";
import { useEffect } from "react";
import { useNetworkStatus } from "./NetworkStatusContext";

export function useAuth() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        console.log("📢 Auth Response:", data); // ✅ ดูค่าที่ได้จาก API

        if (!data.authenticated) {
          console.log("ยังไม่ login");
          window.location.href = "/";
        } else {
          console.log("login แล้ว");
        }
      } catch (error) {
        console.log("login catch");
        window.location.href = "/";
      }
    };

    checkAuth();
  }, []);
}