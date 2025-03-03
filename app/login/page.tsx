"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }) // 👈 ส่ง Cookie ไปให้ API
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          console.log("ยังไม่ login");
          //push หน้า login
          return;
        }
        console.log("login แล้ว");
        router.push("/main");
      })
      .catch(() => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("process login 1");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    console.log("process login 3");
    if (res.ok) {
      console.log("process login 4");
      router.push("/main"); // ✅ ไปหน้าหลักเมื่อ Login สำเร็จ
    } else {
      console.log("process login 5");
      setError("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">

      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <p className="text-gray-500">เข้าสู่ระบบเพื่อใช้งาน</p>
      </div>


      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <form onSubmit={handleLogin} className="space-y-4">
          <p className="text-gray-500 text-sm ">ชื่อผู้ใช้งาน</p>
          <div className="relative ">
            <FaUser className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="ระบุชื่อผู้ใช้งาน"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
              required
            />
          </div>
          <p className="text-gray-500 text-sm">รหัสผ่าน</p>
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="ระบุรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="mr-2" />
              จดจำการเข้าสู่ระบบ
            </label>
            <a href="/forgot-password" className="text-blue-500 text-sm">ลืมรหัสผ่าน?</a>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md font-bold hover:bg-blue-600">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
      <p className="text-center text-gray-400 text-sm mt-6">Version 1.0.0</p>
      <p className="text-center text-gray-400 text-xs">© 2025 AdaPos+. All rights reserved.</p>
    </div>
  );
};