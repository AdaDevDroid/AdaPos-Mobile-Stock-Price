"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_INSxUserToDB, C_INSoSysConfigToDB, C_DELoSysConfigData, C_GETxUserData } from "@/hooks/CIndexedDB";
import { CEncrypt } from '../../hooks/CEncrypt';
import { serialize, parse } from "cookie";
import { useNetworkStatus } from '@/hooks/NetworkStatusContext'
import Image from "next/image";
import BrancheModal from "@/components/BchModal";
import { UserInfo, BranchInfo } from "@/models/models";

export default function Login() {
  const router = useRouter();
  const [tUsername, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [tError, setError] = useState("");
  const [bLoading, setLoading] = useState(false);
  const isOnline = useNetworkStatus()
  const [oDatabase, setODatabase] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [oUserInfo, setUserInfo] = useState<UserInfo[]>([]);
  const [oBranchInfo, setBranchInfo] = useState<BranchInfo[]>([]);
  const [tCompName, setCompName] = useState("");
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
    const openDB = async () => {
      const db = await C_PRCxOpenIndexedDB();
      setODatabase(db);
    };
    openDB();
  }, []);

  useEffect(() => {
    // ✅ ดึง Cookie จาก Request
    const cookies = parse(document.cookie);
    const savedUsername = cookies.rememberedUsername;
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }

    const cachedToken = localStorage.getItem("session_token");
    const tokenExpiry = localStorage.getItem("session_expiry");

    if (!cachedToken) {
      console.log("ยังไม่ login");
      return;
    }
    if (tokenExpiry) {
      const nowMinutes = Date.now() / (60 * 1000);
      console.log(tokenExpiry, nowMinutes)
      if (nowMinutes > Number(tokenExpiry)) {
        return;
      }
    }
    console.log("login แล้ว");
    router.push("/main");

  }, []);

  const C_SETxToken = (token: string) => {
    const nExpToken = 60; // เวลาหมดอายุในหน่วยนาที
    const tokenExpiry = Math.floor(Date.now() / 1000 / 60) + nExpToken; // แปลงเวลาปัจจุบันเป็นนาที และเพิ่มเวลาหมดอายุ 60 นาที
    localStorage.setItem("session_token", token);
    localStorage.setItem("session_expiry", tokenExpiry.toString()); // เก็บเวลาในหน่วยนาที
    console.log("✅ Token Stored with Expiry:", new Date(tokenExpiry * 60 * 1000).toLocaleString()); // แปลงกลับเป็นมิลลิวินาทีเพื่อแสดงผล
  };

  const C_PRCbCheckUser = async (username: string, password: string, isOnline: boolean) => {
    if (!isOnline) {
      console.log("🔴 Offline Mode: Validating User from IndexedDB");
      if (!oDatabase) {
        throw new Error("Database is not initialized");
      }
      const oUserData = await C_GETxUserData(oDatabase);
      console.log("oUserData:", oUserData);
    
      const encryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);
      console.log("oUserData:", oUserData);
      return oUserData && oUserData.FTUsrLogin === username && oUserData.FTUsrLoginPwd === encryptedPassword;
    }

    console.log("🟢 Online Mode: Validating User via API");
    const userResponse = await fetch("/api/query/selectUsrLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!userResponse.ok) return false;
    const { user } = await userResponse.json();
    
    if(user.length>1){

      setUserInfo(user);
      setBranchInfo(user);
      setCompName(user[0].FTAgnName);
      setIsBranchOpen(true);
     
    }else{
      if (user[0].FTBchCode) {
        if (oDatabase) {
          await C_INSxUserToDB(oDatabase, {
            FTUsrCode: user[0].FTUsrCode,
            FTUsrLogin: user[0].FTUsrLogin,
            FTUsrLoginPwd: user[0].FTUsrLoginPwd,
            FTUsrName: user[0].FTUsrName,
            FTBchCode: user[0].FTBchCode,
            FTBchName: user[0].FTBchName,
            FTAgnCode: user[0].FTAgnCode,
            FTAgnName: user[0].FTAgnName,
            FTMerCode: user[0].FTMerCode,
          });
        }
        console.log("✅ User validated & stored locally.");
        return true;
      }
      else {
        if (user[0].FTAgnCode) {

          console.log("🟢 Online Mode: Validating User via API");
          const BchResponse = await fetch("/api/query/selectBchByAgn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ FTAgnCode: user[0].FTAgnCode }), // ส่งค่า FTAgnCode ไปยัง API
          });
          if (!BchResponse.ok) return false;
          const { bch } = await BchResponse.json();


          setUserInfo(user);
          setBranchInfo(bch);
          setCompName(user[0].FTAgnName);
          setIsBranchOpen(true);
        }
        else {
          console.log("✅User 009 ");
          console.log("🟢 Online Mode: Validating User via API");
          const BchResponse = await fetch("/api/query/selectBchAll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (!BchResponse.ok) return false;
          const { bch } = await BchResponse.json();

          const CompResponse = await fetch("/api/query/selectCompName", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (!CompResponse.ok) return false;
          const { comp } = await CompResponse.json();

          setUserInfo(user);
          setCompName(comp);
          setBranchInfo(bch);
          setIsBranchOpen(true);

        }
      }
    }




  };
  const C_PRCxSyncConfig = async (oDatabase: IDBDatabase) => {
    try {
      console.log("🔄 Syncing SysConfig...");
      const response = await fetch("/api/query/selectSysConfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch SysConfig");
      const oConfigData = await response.json();

      await C_DELoSysConfigData(oDatabase);
      if (Array.isArray(oConfigData.config)) {
        for (const config of oConfigData.config) {
          if (config.FTSysCode && config.FTSysStaUsrValue) {
            await C_INSoSysConfigToDB(oDatabase, {
              FTSysCode: config.FTSysCode,
              FTSysStaUsrValue: config.FTSysStaUsrValue,
            });
          }
        }
        console.log("✅ SysConfig Sync Completed");
      } else {
        console.log("❌ Invalid SysConfig Data:", oConfigData);
      }
    } catch (error) {
      console.log("⚠️ SysConfig Sync Failed:", error);
    }
  };
  const C_PRCxClickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userValid = await C_PRCbCheckUser(tUsername, password, isOnline);

      if (!userValid) {
        setError("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง2");
        return;
      }

      if (isOnline) {
        if (oDatabase) {
          await C_PRCxSyncConfig(oDatabase);
        } else {
          throw new Error("Database is not initialized");
        }
      }

      console.log("🔓 Generating token...");
      const token = await C_GETtGenToken(tUsername);
      if (!token) {
        throw new Error("❌ Token Generation Failed");
      }

      C_SETxToken(token);
      router.push("/main");

      document.cookie = serialize("rememberedUsername", rememberMe ? tUsername : "", {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: "/",
      });

    } catch (error) {
      console.log("⚠️ Login Error:", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };


  async function C_GETtGenToken(username: string): Promise<string> {
    try {
      // ✅ ตรวจสอบว่า crypto.subtle รองรับหรือไม่
      if (window.crypto?.subtle && typeof TextEncoder !== "undefined") {
        const encoder = new TextEncoder();
        const data = encoder.encode(`${username}-${Date.now()}`);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const token = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        return token;
      } else {
        // ⚠️ Fallback: ใช้วิธีแบบพื้นฐานที่รองรับทั่วไป
        const fallbackToken = `${username}-${Date.now()}-${Math.floor(Math.random() * 1e8)}`;
        console.warn("⚠️ ใช้ fallback token เนื่องจาก crypto.subtle ไม่รองรับ:", fallbackToken);
        return fallbackToken;
      }
    } catch (error) {
      console.error("❌ Error generating offline token:", error);
      alert("❌ Error generating offline token: " + error);
      return "";
    }
  }

  const C_PRCxBchSelect = async (FTBchCode: string, FTBchName: string) => {
    // alert("FTBchCode: " + FTBchCode + " FTBchName: " + FTBchName);
    setError("");
    setIsLoading(true);


    if (oDatabase) {
      await C_INSxUserToDB(oDatabase, {
        FTUsrCode: oUserInfo[0]?.FTUsrCode,
        FTUsrLogin: oUserInfo[0]?.FTUsrLogin,
        FTUsrLoginPwd: oUserInfo[0]?.FTUsrLoginPwd,
        FTUsrName: oUserInfo[0]?.FTUsrName,
        FTBchCode: FTBchCode,
        FTBchName: FTBchName,
        FTAgnName: tCompName,
        FTAgnCode: oUserInfo[0]?.FTAgnCode,
        FTMerCode: oUserInfo[0]?.FTMerCode,
      });
    }
    console.log("✅ User validated & stored locally.2");


    try {
      if (isOnline) {
        if (oDatabase) {
          await C_PRCxSyncConfig(oDatabase);
        } else {
          throw new Error("Database is not initialized");
        }
      }

      console.log("🔓 Generating token...");
      const token = await C_GETtGenToken(tUsername);
      if (!token) {
        throw new Error("❌ Token Generation Failed");
      }

      C_SETxToken(token);
      router.push("/main");

      document.cookie = serialize("rememberedUsername", rememberMe ? tUsername : "", {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: "/",
      });

    } catch (error) {
      console.log("⚠️ Login Error:", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setError(""); 
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          <Image
            src="/icons/logoAda.png"
            alt="Logo"
            width={64}
            height={64}
            className="h-16 text-center text-sm"
          />
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <p className="text-gray-500">เข้าสู่ระบบเพื่อใช้งาน</p>
      </div>

      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <form onSubmit={C_PRCxClickLogin} className="space-y-4">
          <p className="text-gray-500 text-sm ">ชื่อผู้ใช้งาน</p>
          <div className="relative ">
            <FaUser className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="ระบุชื่อผู้ใช้งาน"
              value={tUsername}
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
          {tError && <p className="text-red-500 text-sm text-center">{tError}</p>}
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
            disabled={bLoading} // Disable button while loading
          >
            {bLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>

      <p className="text-center text-gray-400 text-sm mt-6">Version 1.0.10</p>
      <p className="text-center text-gray-400 text-xs">© 2025 AdaPos+. All rights reserved.</p>
      <Image
        src="/icons/logoAdaLogin.png"
        alt="Logo"
        width={80}
        height={80}
        className="text-center"
      />
      <BrancheModal
        isOpen={isBranchOpen}
        onClose={() => { setIsBranchOpen(false); setError(""); }}
        oData={oBranchInfo || []}
        onOptionSelect={C_PRCxBchSelect}
      />
      

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50 z-[9999]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
