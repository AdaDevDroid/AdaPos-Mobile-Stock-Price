"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_INSxUserToDB, C_INSoSysConfigToDB, C_DELoSysConfigData, C_GETxUserData } from "@/hooks/CIndexedDB";
import { CEncrypt } from '../../hooks/CEncrypt';
import { serialize, parse } from "cookie";
import { useNetworkStatus } from '@/hooks/NetworkStatusContext'

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ ดึง Cookie จาก Request
    const cookies = parse(document.cookie);
    const savedUsername = cookies.rememberedUsername;
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }

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
    setLoading(true);
    try {
      const oDatabase = await C_PRCxOpenIndexedDB();
      const isOnline = useNetworkStatus()

      const validateUser = async () => {
        if (!isOnline) {
          const oUserData = await C_GETxUserData(oDatabase);
          const tEncryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);
          return oUserData && oUserData.FTUsrLogin === username && oUserData.FTUsrPass === tEncryptedPassword;
        } else {
          const userResponse = await fetch("/api/query/selectUsrLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (userResponse.ok) {
            const oData = await userResponse.json();
            await C_INSxUserToDB(oDatabase, {
              FTUsrCode: oData.user.FTUsrCode,
              FTUsrLogin: oData.user.FTUsrLogin,
              FTUsrPass: oData.user.FTUsrLoginPwd,
              FTUsrName: oData.user.FTUsrName,
              FTBchCode: oData.user.FTBchCode,
              FTAgnCode: oData.user.FTAgnCode,
              FTMerCode: oData.user.FTMerCode,
            });

            // Sync SysConfig
            console.log("Process Sync SysConfig 1");
            const rSysConfig = await fetch("/api/query/selectSysConfig", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });

            const oConfigData = await rSysConfig.json();
            console.log(oConfigData);

            if (rSysConfig.ok) {

              C_DELoSysConfigData(oDatabase);

              if (oConfigData && Array.isArray(oConfigData.config)) {
                for (const config of oConfigData.config) {
                  const oSysConfig = {
                    FTSysCode: config.FTSysCode,
                    FTSysStaUsrValue: config.FTSysStaUsrValue,
                  };
                  if (oSysConfig.FTSysCode && oSysConfig.FTSysStaUsrValue) {
                    await C_INSoSysConfigToDB(oDatabase, oSysConfig);
                    console.log("Process Sync SysConfig 2");
                  } else {
                    console.error("Invalid SysConfig data:", oSysConfig);
                  }
                }
              } else {
                console.error("Invalid Config Data Structure:", oConfigData);
              }
            }
            
            return true;
          }
        }
        return false;
      };

      if (await validateUser()) {
        // ✅ ส่งข้อมูลผู้ใช้ไปยัง API เพื่อสร้าง Token
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        router.push("/main");
      } else {
        setError("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }

      document.cookie = serialize('rememberedUsername', rememberMe ? username : '', {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: "/",
      });
      
    } catch (error) {
      console.error("Login failed:", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
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
              จดจำผู้ใช้งาน
            </label>
            {/* <a href="#" className="text-blue-500 text-sm">ลืมรหัสผ่าน?</a> */}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md font-bold hover:bg-blue-600"
            disabled={loading} // Disable button while loading
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
      <p className="text-center text-gray-400 text-sm mt-6">Version 1.0.0</p>
      <p className="text-center text-gray-400 text-xs">© 2025 AdaPos+. All rights reserved.</p>
    </div>
  );
};