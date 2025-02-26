"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          console.log("ยังไม่ login");
          router.push("/login");
        } else {
          console.log("login แล้ว");
          router.push("/main");
        }
      })
      .catch(() => {
        router.push("/login");
        console.log("ยังไม่ login catch");
      });
  }, [router]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered:', reg))
        .catch(err => console.error('Service Worker registration failed:', err));
    }
  }, []);

  // Return null or an empty fragment to render nothing
  return null;
}