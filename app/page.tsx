"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
    try {
      setLoading(true)
      const cachedToken = localStorage.getItem("session_token");
      const tokenExpiry = localStorage.getItem("session_expiry");
      if (!cachedToken) {
        console.log("❌ ไม่มี Token ใน Cache, Redirect ไปหน้า Login");
        setLoading(false)
        router.replace("/login");
        return;
      }
      if (tokenExpiry) {
        const nowMinutes = Math.floor(Date.now() / 1000 / 60);
        console.log(tokenExpiry, nowMinutes)
        if (nowMinutes > parseInt(tokenExpiry)) {
          console.log("❌ Token หมดอายุ → Redirect ไปหน้า Login");
          localStorage.removeItem("session_token");
          localStorage.removeItem("session_expiry");
          setLoading(false)
          router.replace("/login");
        }
      }

      console.log("✅ ใช้ Token ล่าสุดจาก LocalStorage");
      setLoading(false)
      router.replace("/main");
      return

    } catch (error) {
      console.log("⚠️ Error เช็คสิทธิ์:", error);
      setLoading(false)
      router.replace("/login");
    }
  };

  checkAuth();
}, [router]);

if (loading) {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>
  );
}

return null;
}