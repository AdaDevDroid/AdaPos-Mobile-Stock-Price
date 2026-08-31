"use client";
import { useEffect, useRef, useState } from "react";
import { useAppUpdateGuard, C_REQxAppRepair } from "@/hooks/CAppUpdate";
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
  C_CLRxPartSession,
  C_GEToDatabaseHeaders,
  C_GETtActiveBasePath,
  C_GETtActiveDatabasePart,
  C_GETtPartSessionStorageKey,
  C_GETtPartUrl,
  C_GETtRememberedUsernameCookieName,
  C_GETxActivePartCacheStatus,
  C_GETxPartSession,
  C_SETxPartSession,
} from "@/hooks/CDatabaseSettings";

const BRANCH_SELECTION_REQUIRED = "branch-selection-required";
const NO_BRANCH_AVAILABLE = "no-branch-available";

class LoginApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly requestId: string,
    message: string,
  ) {
    super(message);
    this.name = "LoginApiError";
  }
}

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
  const [usernameEdited, setUsernameEdited] = useState(false);
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
  const VERSION = process.env.NEXT_PUBLIC_VERSION || "unknown";

  const { workboxCount, offlineRequired, staticCount, staticRequired, isReady } = usePWACacheStatus();
  const [showWrench, setShowWrench] = useState(false);

  const [showOfflineText, setShowOfflineText] = useState(true);

  useEffect(() => {
    if (isReady) {
      setShowOfflineText(true);
      const timer = setTimeout(() => setShowOfflineText(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineText(true);
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady) {
      const timer = setTimeout(() => setShowWrench(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowWrench(false);
    }
  }, [isReady]);


  function usePWACacheStatus() {
      const [status, setStatus] = useState({
        workboxCount: 0,
        offlineRequired: 9,
        staticCount: 0,
        staticRequired: 0,
        isReady: false
    });

    useEffect(() => {
      const checkCache = async () => {
        if (!('caches' in window)) {
          console.warn('❌ Browser ไม่รองรับ Cache API');
          return;
        }

        try {
          const cacheStatus = await C_GETxActivePartCacheStatus();
          setStatus({
            workboxCount: cacheStatus.offlineCount,
            offlineRequired: cacheStatus.offlineRequired,
            staticCount: cacheStatus.staticCount,
            staticRequired: cacheStatus.staticRequired,
            isReady: cacheStatus.isReady,
          });
        } catch (error) {
          console.error('❌ ตรวจสอบ cache ผิดพลาด:', error);
        }
      };

      const interval = setInterval(checkCache, 5000);
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
      const savedUsername = cookies[C_GETtRememberedUsernameCookieName()] || cookies.rememberedUsername;
      if (savedUsername) {
        setUrlImg(oUserData?.FTImgObj ?? "");
      }
    };
    openDB();
  }, []);



  useEffect(() => {
    sessionStorage.setItem(C_GETtPartSessionStorageKey("shouldReload"), "true");
    const cookies = parse(document.cookie);
    const savedUsername = cookies[C_GETtRememberedUsernameCookieName()] || cookies.rememberedUsername;
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }

    const { token: cachedToken, expiry: tokenExpiry, part: sessionPart } = C_GETxPartSession();
    const expiryMinutes = Number(tokenExpiry);

    if (
      !cachedToken ||
      !tokenExpiry ||
      !Number.isFinite(expiryMinutes) ||
      Math.floor(Date.now() / 1000 / 60) > expiryMinutes ||
      sessionPart !== C_GETtActiveDatabasePart()
    ) {
      C_CLRxPartSession();
      return;
    }

    window.location.href = C_GETtPartUrl("/main");

  }, [router]);

  const C_SETxToken = (token: string) => {
    const nExpToken = 24 * 60; // เพิ่มเวลาเป็น 24 ชั่วโมง (1440 นาที) สำหรับการใช้งานระยะยาว
    const tokenExpiry = C_GETnJwtExpiryMinutes(token) || Math.floor(Date.now() / 1000 / 60) + nExpToken;
    C_SETxPartSession(token, tokenExpiry.toString());
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
    const userPayload = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok) {
      if (userResponse.status === 409 && userPayload?.code === NO_BRANCH_AVAILABLE) {
        return NO_BRANCH_AVAILABLE;
      }
      if (userResponse.status === 401) {
        return false;
      }
      throw new LoginApiError(
        userResponse.status,
        typeof userPayload?.code === "string" ? userPayload.code : "login-request-failed",
        typeof userPayload?.requestId === "string" ? userPayload.requestId : "",
        typeof userPayload?.message === "string" ? userPayload.message : "Login request failed",
      );
    }

    const { user, token } = userPayload;
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

    if (primaryUser.FTStaHasGroup !== "1") {
      return NO_BRANCH_AVAILABLE;
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
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        companyName = typeof companyData.comp === "string" ? companyData.comp : "";
      }
    }

    if (!branchResponse.ok) {
      if (branchResponse.status === 404) {
        return NO_BRANCH_AVAILABLE;
      }
      const errorPayload = await branchResponse.json().catch(() => ({}));
      throw new LoginApiError(
        branchResponse.status,
        typeof errorPayload?.code === "string" ? errorPayload.code : "branch-request-failed",
        typeof errorPayload?.requestId === "string" ? errorPayload.requestId : "",
        typeof errorPayload?.message === "string" ? errorPayload.message : "Failed to fetch branch data",
      );
    }
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

    return NO_BRANCH_AVAILABLE;
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

      if (userValid === NO_BRANCH_AVAILABLE) {
        setError("ไม่พบข้อมูลสาขาในระบบ กรุณาติดต่อผู้ดูแล");
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
      document.cookie = serialize(C_GETtRememberedUsernameCookieName(), rememberMe ? tUsername : "", {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: `${C_GETtActiveBasePath().replace(/\/+$/, "")}/`,
      });

      window.location.href = C_GETtPartUrl("/main");

    } catch (error) {
      console.log("⚠️ Login Error:", error);
      if (error instanceof LoginApiError) {
        const reference = error.requestId ? ` (รหัสอ้างอิง: ${error.requestId})` : "";
        if (error.status === 400) {
          setError(`ข้อมูลเข้าสู่ระบบไม่ถูกต้อง${reference}`);
        } else if (error.status === 503) {
          setError(`ไม่สามารถเชื่อมต่อฐานข้อมูล กรุณาลองใหม่${reference}`);
        } else if (error.status >= 500) {
          setError(`Server เกิดข้อผิดพลาด กรุณาลองใหม่${reference}`);
        } else {
          setError(`${error.message}${reference}`);
        }
      } else if (error instanceof TypeError) {
        setError("ไม่สามารถเชื่อมต่อ Server ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่");
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
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
      document.cookie = serialize(C_GETtRememberedUsernameCookieName(), rememberMe ? tUsername : "", {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : -1,
        path: `${C_GETtActiveBasePath().replace(/\/+$/, "")}/`,
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
      const cacheStatus = await C_GETxActivePartCacheStatus();
      const workboxCount = cacheStatus.offlineCount;
      const staticCount = cacheStatus.staticCount;

      console.log(`📦 จำนวนไฟล์ offline-cache: ${workboxCount}`);
      console.log(`📦 จำนวนไฟล์ static-resources: ${staticCount}`);

      if (cacheStatus.isReady) {
        alert('✅ พร้อมใช้งานออฟไลน์แล้ว! 🎉');
      } else {
        const missing = [];
        if (cacheStatus.missingOffline.length > 0) {
          missing.push(`offline-cache (${workboxCount}/${cacheStatus.offlineRequired})`);
        }
        if (cacheStatus.missingStatic.length > 0) {
          missing.push(`static-resources (${staticCount}/${cacheStatus.staticRequired})`);
        }

        const confirmClear = confirm(`ไฟล์สำหรับ Offline ไม่ครบ: ${missing.join(', ')}\n\nคุณต้องการซ่อมแซมไฟล์และโหลดใหม่หรือไม่?`);

        if (confirmClear) {
          C_REQxAppRepair();
        } else {
          alert('ยกเลิกการล้าง cache');
        }
      }

    } catch (error) {
      console.error('เกิดข้อผิดพลาดระหว่างตรวจสอบ cache:', error);
      alert(error instanceof Error
        ? `ซ่อมแซมไฟล์ไม่สำเร็จ: ${error.message}`
        : 'ซ่อมแซมไฟล์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ Server');
    }
  }

  useAppUpdateGuard(Boolean((usernameEdited && tUsername) || password || bLoading || isLoading || isBranchOpen));

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
              onChange={(e) => { setUsernameEdited(true); setUsername(e.target.value); }}
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
              {isReady ? (
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
                    offline: {workboxCount}/{offlineRequired}<br />
                    static: {staticCount}/{staticRequired}
                  </div>
                </div>
              )}
            </div>
            <div className={`mt-1 text-xs text-center leading-snug ${isReady
              ? 'text-green-600'
              : showWrench
                ? 'text-yellow-500'
                : 'text-yellow-500'
              }`}>
              {isReady ? (
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
