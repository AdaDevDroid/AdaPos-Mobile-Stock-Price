"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import { C_PRCxOpenIndexedDB, C_INSxUserToDB, C_INSoSysConfigToDB, C_DELoSysConfigData, C_GETxUserData } from "@/hooks/CIndexedDB";
import { CEncrypt } from '../../hooks/CEncrypt';
import { serialize, parse } from "cookie";
import { useNetworkStatus } from '@/hooks/NetworkStatusContext'
import Image from "next/image";
import BrancheModal from "@/components/BchModal";
import { UserInfo, BranchInfo } from "@/models/models";
import { FaWrench, FaCheckCircle, FaSpinner } from "react-icons/fa";
import {
  C_GEToDatabaseHeaders,
  C_GETtActiveDatabasePart,
  C_GEToDatabaseSettings,
  C_GETtPartUrl,
  C_REGxServiceWorkerForActivePart,
  C_SEToDatabaseSettings,
  C_SYNCxDatabasePartFromUrl,
  SESSION_PART_STORAGE_KEY,
} from "@/hooks/CDatabaseSettings";

const REQUIRED_OFFLINE_CACHE_ITEMS = 9;
const MIN_STATIC_CACHE_ITEMS = 3;
const BRANCH_SELECTION_REQUIRED = "branch-selection-required";

const C_GETbOfflineCacheReady = (offlineCount: number, staticCount: number) => {
  return offlineCount >= REQUIRED_OFFLINE_CACHE_ITEMS && staticCount >= MIN_STATIC_CACHE_ITEMS;
};

const C_GETnJwtExpiryMinutes = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(paddedPayload)) as { exp?: unknown };

    return typeof decoded.exp === "number" ? Math.floor(decoded.exp / 60) : null;
  } catch {
    return null;
  }
};

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
  const [tUrlImg, setUrlImg] = useState("");
  const tServerTokenRef = useRef("");
  const VERSION = process.env.NEXT_PUBLIC_VERSION as string;

  const { workboxCount, staticCount, isReady } = usePWACacheStatus();
  const [showWrench, setShowWrench] = useState(false);

  const [showOfflineText, setShowOfflineText] = useState(true);

  useEffect(() => {
    C_SYNCxDatabasePartFromUrl();
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {

        const version = process.env.NEXT_PUBLIC_VERSION as string || "0.0.0";
        const localVersion = localStorage.getItem("app_version");
        console.log(version, localVersion);
        if (localVersion && localVersion !== version) {
          console.log("🔁 เวอร์ชันใหม่ ตรวจพบ! เคลียร์ cache แล้วรีโหลด");

          // เคลียร์ cache
          if ("caches" in window) {

            //alert("ตรวจพบเวอร์ชันใหม่ กำลังรีโหลดหน้าใหม่");
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          }

          // ล้าง localStorage/sessionStorage
          const databaseSettings = C_GEToDatabaseSettings();
          localStorage.clear();
          if (databaseSettings.part || databaseSettings.database) {
            C_SEToDatabaseSettings(databaseSettings.part, databaseSettings.database);
          }
          // อัปเดต version ใหม่
          localStorage.setItem("app_version", version);

          clearServiceWorker();
          // รีโหลดหน้า
          //window.location.reload();
        } else {
          localStorage.setItem("app_version", version);
        }
      } catch (err) {
        console.error("❌ ตรวจ version ไม่สำเร็จ:", err);
      }
    };

    checkVersion();
  }, []);

  useEffect(() => {
    if (C_GETbOfflineCacheReady(workboxCount, staticCount)) {
      setShowOfflineText(true);
      const timer = setTimeout(() => setShowOfflineText(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineText(true);
    }
  }, [workboxCount, staticCount]);

  useEffect(() => {
    if (!isReady) {
      const timer = setTimeout(() => setShowWrench(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowWrench(false);
    }
  }, [isReady]);


  useEffect(() => {
    if ("serviceWorker" in navigator) {
      C_REGxServiceWorkerForActivePart()
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.log("Service Worker registration failed:", err));

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.status === 'cache-complete') {
          alert('✅ พร้อมใช้งานออฟไลน์แล้ว');
        }
      });
    }
  }, []);


  function usePWACacheStatus() {
    const [status, setStatus] = useState({
      workboxCount: 0,
      staticCount: 0,
      isReady: false
    });

    useEffect(() => {
      const checkCache = async () => {
        if (!('caches' in window)) {
          console.warn('❌ Browser ไม่รองรับ Cache API');
          return;
        }

        try {
          const cacheNames = await caches.keys();
          let workboxCount = 0;
          let staticCount = 0;

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            if (cacheName.startsWith('adapos-offline') || cacheName.startsWith('workbox-precache')) {
              workboxCount += requests.length;
            }
            if (cacheName.startsWith('static-resources')) {
              staticCount += requests.length;
            }
          }

          const isReady = C_GETbOfflineCacheReady(workboxCount, staticCount);
          setStatus({ workboxCount, staticCount, isReady });
        } catch (error) {
          console.error('❌ ตรวจสอบ cache ผิดพลาด:', error);
        }
      };

      const interval = setInterval(checkCache, 1000);  // เช็คทุก 1 วินาที
      checkCache(); // เรียกทันทีตอนโหลด

      return () => clearInterval(interval);
    }, []);

    return status;
  }


  useEffect(() => {
    const openDB = async () => {
      const db = await C_PRCxOpenIndexedDB();
      setODatabase(db);
      const oUserData = await C_GETxUserData(db);
      console.log("oUserData:", oUserData);
      const cookies = parse(document.cookie);
      const savedUsername = cookies.rememberedUsername;
      if (savedUsername) {
        setUrlImg(oUserData?.FTImgObj ?? "");
      }
    };
    openDB();
  }, []);



  useEffect(() => {
    sessionStorage.setItem("shouldReload", "true");
    // ✅ ดึง Cookie จาก Request
    const cookies = parse(document.cookie);
    const savedUsername = cookies.rememberedUsername;
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }

    const cachedToken = localStorage.getItem("session_token");
    const tokenExpiry = localStorage.getItem("session_expiry");
    const sessionPart = localStorage.getItem(SESSION_PART_STORAGE_KEY);
    const expiryMinutes = Number(tokenExpiry);

    if (
      !cachedToken ||
      !tokenExpiry ||
      !Number.isFinite(expiryMinutes) ||
      Math.floor(Date.now() / 1000 / 60) > expiryMinutes ||
      sessionPart !== C_GETtActiveDatabasePart()
    ) {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_expiry");
      localStorage.removeItem(SESSION_PART_STORAGE_KEY);
      return;
    }

    window.location.href = C_GETtPartUrl("/main");

  }, [router]);

  const C_SETxToken = (token: string) => {
    const nExpToken = 24 * 60; // เพิ่มเวลาเป็น 24 ชั่วโมง (1440 นาที) สำหรับการใช้งานระยะยาว
    const tokenExpiry = C_GETnJwtExpiryMinutes(token) || Math.floor(Date.now() / 1000 / 60) + nExpToken;
    localStorage.setItem("session_token", token);
    localStorage.setItem("session_expiry", tokenExpiry.toString()); // เก็บเวลาในหน่วยนาที
    localStorage.setItem(SESSION_PART_STORAGE_KEY, C_GETtActiveDatabasePart());
    localStorage.setItem("last_activity", Date.now().toString()); // เก็บเวลาล่าสุดที่ใช้งาน
    console.log("✅ Token Stored with Expiry:", new Date(tokenExpiry * 60 * 1000).toLocaleString()); // แปลงกลับเป็นมิลลิวินาทีเพื่อแสดงผล
  };

  const C_PRCbCheckUser = async (username: string, password: string, isOnline: boolean) => {
    if (!isOnline) {
      if (!oDatabase) {
        throw new Error("Database is not initialized");
      }

      const oUserData = await C_GETxUserData(oDatabase);
      const encryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);
      return Boolean(
        oUserData &&
        oUserData.FTUsrLogin?.toLowerCase() === username.toLowerCase() &&
        oUserData.FTUsrLoginPwd === encryptedPassword
      );
    }

    const userResponse = await fetch(C_GETtPartUrl("/api/query/selectUsrLogin"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...C_GEToDatabaseHeaders(tServerTokenRef.current) },
      body: JSON.stringify({ username, password }),
    });
    if (!userResponse.ok) return false;

    const { user, token } = await userResponse.json();
    if (!Array.isArray(user) || user.length === 0 || typeof token !== "string" || !token) {
      return false;
    }

    tServerTokenRef.current = token;
    const primaryUser = user[0] as UserInfo;

    const C_STOxUserForBranch = async (branch: BranchInfo, companyName: string) => {
      if (!branch?.FTBchCode) return false;
      if (!oDatabase) {
        throw new Error("Database is not initialized");
      }

      await C_INSxUserToDB(oDatabase, {
        ...primaryUser,
        FTBchCode: branch.FTBchCode,
        FTBchName: branch.FTBchName,
        FTAgnName: companyName || primaryUser.FTAgnName,
      });
      return true;
    };

    const C_SHWxBranchSelection = (branches: BranchInfo[], companyName: string) => {
      setUserInfo(user as UserInfo[]);
      setBranchInfo(branches);
      setCompName(companyName);
      setIsBranchOpen(true);
      return BRANCH_SELECTION_REQUIRED;
    };

    const assignedBranchMap = new Map<string, BranchInfo>();
    for (const item of user as UserInfo[]) {
      if (item.FTBchCode && !assignedBranchMap.has(item.FTBchCode)) {
        assignedBranchMap.set(item.FTBchCode, {
          FTBchCode: item.FTBchCode,
          FTBchName: item.FTBchName,
        });
      }
    }

    const assignedBranches = Array.from(assignedBranchMap.values());
    if (assignedBranches.length > 1) {
      return C_SHWxBranchSelection(assignedBranches, primaryUser.FTAgnName);
    }
    if (assignedBranches.length === 1) {
      return C_STOxUserForBranch(assignedBranches[0], primaryUser.FTAgnName);
    }

    let branchResponse: Response;
    let companyName = primaryUser.FTAgnName || "";
    if (primaryUser.FTAgnCode) {
      branchResponse = await fetch(C_GETtPartUrl("/api/query/selectBchByAgn"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...C_GEToDatabaseHeaders(tServerTokenRef.current) },
        body: JSON.stringify({ FTAgnCode: primaryUser.FTAgnCode }),
      });
    } else {
      branchResponse = await fetch(C_GETtPartUrl("/api/query/selectBchAll"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...C_GEToDatabaseHeaders(tServerTokenRef.current) },
      });

      const companyResponse = await fetch(C_GETtPartUrl("/api/query/selectCompName"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...C_GEToDatabaseHeaders(tServerTokenRef.current) },
      });
      if (!companyResponse.ok) return false;

      const companyData = await companyResponse.json();
      companyName = typeof companyData.comp === "string" ? companyData.comp : "";
    }

    if (!branchResponse.ok) return false;
    const branchData = await branchResponse.json();
    const branches = Array.isArray(branchData.bch)
      ? branchData.bch.filter((branch: BranchInfo) => Boolean(branch?.FTBchCode))
      : [];

    if (branches.length > 1) {
      return C_SHWxBranchSelection(branches, companyName);
    }
    if (branches.length === 1) {
      return C_STOxUserForBranch(branches[0], companyName);
    }

    return false;
  };
  const C_PRCxSyncConfig = async (oDatabase: IDBDatabase) => {
    try {
      console.log("🔄 Syncing SysConfig...");
      const response = await fetch(C_GETtPartUrl("/api/query/selectSysConfig"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...C_GEToDatabaseHeaders(tServerTokenRef.current) },
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

      if (userValid === BRANCH_SELECTION_REQUIRED) {
        return;
      }

      if (!userValid) {
        setError("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
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
      const token = isOnline ? tServerTokenRef.current : await C_GETtGenToken(tUsername);
      if (!token) {
        throw new Error("❌ Token Generation Failed");
      }

      C_SETxToken(token);
      document.cookie = serialize("rememberedUsername", rememberMe ? tUsername : "", {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: "/",
      });

      window.location.href = C_GETtPartUrl("/main");

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
    setError("");
    setIsLoading(true);

    try {
      const selectedUser = oUserInfo[0];
      if (!oDatabase || !selectedUser || !FTBchCode) {
        throw new Error("Branch selection data is incomplete");
      }

      await C_INSxUserToDB(oDatabase, {
        ...selectedUser,
        FTBchCode,
        FTBchName,
        FTAgnName: tCompName || selectedUser.FTAgnName,
      });

      if (isOnline) {
        await C_PRCxSyncConfig(oDatabase);
      }

      const token = isOnline ? tServerTokenRef.current : await C_GETtGenToken(tUsername);
      if (!token) {
        throw new Error("Token generation failed");
      }

      C_SETxToken(token);
      document.cookie = serialize("rememberedUsername", rememberMe ? tUsername : "", {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: "/",
      });

      setIsBranchOpen(false);
      window.location.href = C_GETtPartUrl("/main");
    } catch (error) {
      console.log("Branch selection error:", error);
      setIsBranchOpen(false);
      setError("เกิดข้อผิดพลาดในการเลือกสาขา กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };
  async function checkPWACacheReady() {
    if (!('caches' in window)) {
      alert('❌ Browser นี้ไม่รองรับ Cache API');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      console.log('Caches ในระบบ:', cacheNames);

      let workboxCount = 0;
      let staticCount = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        if (cacheName.startsWith('adapos-offline') || cacheName.startsWith('workbox-precache')) {
          workboxCount += requests.length;
        }

        if (cacheName.startsWith('static-resources')) {
          staticCount += requests.length;
        }
      }

      console.log(`📦 จำนวนไฟล์ offline-cache: ${workboxCount}`);
      console.log(`📦 จำนวนไฟล์ static-resources: ${staticCount}`);

      if (C_GETbOfflineCacheReady(workboxCount, staticCount)) {
        alert('✅ พร้อมใช้งานออฟไลน์แล้ว! 🎉');
      } else {
        const missing = [];
        if (workboxCount < REQUIRED_OFFLINE_CACHE_ITEMS) {
          missing.push(`offline-cache (${workboxCount}/${REQUIRED_OFFLINE_CACHE_ITEMS})`);
        }
        if (staticCount < MIN_STATIC_CACHE_ITEMS) {
          missing.push(`static-resources (${staticCount}/${MIN_STATIC_CACHE_ITEMS})`);
        }

        const confirmClear = confirm(`ไฟล์สำหรับ Offline ไม่ครบ: ${missing.join(', ')}\n\nคุณต้องการซ่อมแซมไฟล์และโหลดใหม่หรือไม่?`);

        if (confirmClear) {

          clearServiceWorker();

          alert('ซ่อมแซมไฟล์เรียบร้อยแล้ว กำลังรีเฟรชเพื่อโหลดไฟล์สำหรับ Offline ใหม่!');
        } else {
          alert('ยกเลิกการล้าง cache');
        }
      }

    } catch (error) {
      console.error('เกิดข้อผิดพลาดระหว่างตรวจสอบ cache:', error);
      alert('ตรวจสอบ cache ไม่สำเร็จ!');
    }
  }

  function clearServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          reg.unregister().then(() => {
            console.log('🧹 Service Worker ถูกลบเรียบร้อย!');
            window.location.reload();
          });
        });
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          <Image
            // src="/icons/logoAda.png"
            src={tUrlImg && tUrlImg !== "" ? tUrlImg : C_GETtPartUrl("/icons/logoAda.png")}
            alt="Logo"
            width={64}
            height={64}
            className="h-16 text-center text-sm"
            unoptimized
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

      <p className="text-center text-gray-400 text-sm mt-6">Version {VERSION}</p>
      <p className="text-center text-gray-400 text-xs">© 2025 AdaPos+. All rights reserved.</p>



      <div className="fixed bottom-4 left-4 flex items-center gap-2 z-50">
        {showOfflineText && (
          <div className="flex flex-col items-center justify-center">

            <div className="relative flex items-center justify-center">
              {C_GETbOfflineCacheReady(workboxCount, staticCount) ? (
                <div className="group relative">
                  <FaCheckCircle className="text-green-500" size={20} />
                  <div className="absolute left-8 bottom-1 bg-white text-gray-800 shadow p-2 rounded text-xs min-w-max whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    ✅ Offline พร้อมใช้งาน!
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  {showWrench ? (
                    <button
                      onClick={checkPWACacheReady}
                      className="bg-yellow-500 p-2 rounded-full hover:bg-yellow-600 focus:outline-none"
                      title="ซ่อมแซมไฟล์ออฟไลน์"
                    >
                      <FaWrench className="text-white" size={20} />
                    </button>
                  ) : (
                    <FaSpinner className="text-yellow-500 animate-spin" size={20} />
                  )}
                  <div className="absolute left-8 bottom-1 bg-white text-gray-800 shadow p-2 rounded text-xs min-w-max whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    ⚡ Offline ไม่พร้อมใช้งาน<br />
                    offline: {workboxCount}/{REQUIRED_OFFLINE_CACHE_ITEMS}<br />
                    static: {staticCount}/{MIN_STATIC_CACHE_ITEMS}
                  </div>
                </div>
              )}
            </div>
            <div className={`mt-1 text-xs text-center leading-snug ${C_GETbOfflineCacheReady(workboxCount, staticCount)
              ? 'text-green-600'
              : showWrench
                ? 'text-yellow-500'
                : 'text-yellow-500'
              }`}>
              {C_GETbOfflineCacheReady(workboxCount, staticCount) ? (
                <>Offline Mode<br />พร้อมใช้งาน</>
              ) : showWrench ? (
                <>Offline Mode<br />โหลดข้อมูลไม่สำเร็จ<br />กรุณาซ่อมแซมไฟล์</>
              ) : (
                <>Offline Mode<br />กำลังโหลด...</>
              )}
            </div>


          </div>
        )}
      </div>

      <Image
        // src="/icons/logoAdaLogin.png"
        src={tUrlImg && tUrlImg !== "" ? tUrlImg : C_GETtPartUrl("/icons/logoAdaLogin.png")}
        alt="Logo"
        width={80}
        height={0}
        style={{ height: 'auto' }}
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
