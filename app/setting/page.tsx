"use client";

import { useEffect, useState } from "react";
import { FaDatabase, FaLock, FaUser } from "react-icons/fa";
import {
  C_CLRxPartClientState,
  C_GEToDatabaseSettings,
  C_GETtNormalizedDatabaseName,
  C_GETtNormalizedPathPart,
  C_GETtRememberedUsernameCookieName,
  C_SEToDatabaseSettings,
} from "@/hooks/CDatabaseSettings";
import { C_DELxPartIndexedDB } from "@/hooks/CIndexedDB";

const SAFE_PART = /^[A-Za-z0-9._-]+$/;
const SAFE_DATABASE = /^[A-Za-z0-9._-]+$/;
const SAFE_SERVER = /^[A-Za-z0-9._-]*$/;
const RESERVED_PARTS = new Set([
  ".",
  "..",
  "__proto__",
  "constructor",
  "prototype",
  "_next",
  "api",
  "favicon.ico",
  "icons",
  "login",
  "main",
  "manifest.json",
  "price-check",
  "receive",
  "setting",
  "stock",
  "sw.js",
  "test-network.ts",
  "transfer",
]);

type DatabaseSetting = {
  part: string;
  database: string;
  server: string;
  port: number | null;
  user: string;
  hasPassword: boolean;
  connected?: boolean;
  isDefault?: boolean;
};

const C_CLRxPartBrowserState = async (part: string): Promise<boolean> => {
  const results = await Promise.allSettled([
    C_CLRxPartClientState(part),
    C_DELxPartIndexedDB(part),
  ]);
  document.cookie = `${C_GETtRememberedUsernameCookieName(part)}=; Max-Age=0; Path=/${part}/; SameSite=Lax`;
  return results.every((result) => result.status === "fulfilled");
};

export default function SettingPage() {
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [part, setPart] = useState("");
  const [database, setDatabase] = useState("");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [settingsList, setSettingsList] = useState<DatabaseSetting[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPart, setEditingPart] = useState("");
  const [editingIsDefault, setEditingIsDefault] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settings = C_GEToDatabaseSettings();
    setPart(settings.part);
    setDatabase(settings.database);
  }, []);

  const C_GETtBasePath = () => process.env.NEXT_PUBLIC_BASE_PATH || "";

  const C_PRCxLoadSettingsList = async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch(`${C_GETtBasePath()}/api/database-settings/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser,
          password: adminPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
        }

        throw new Error(data.message || "โหลดรายการตั้งค่าไม่สำเร็จ");
      }

      setSettingsList(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoadingSettings(false);
    }
  };

  const C_PRCxUnlockSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSaved("");
    setAuthenticating(true);
    try {
      const response = await fetch(`${C_GETtBasePath()}/api/database-settings/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser,
          password: adminPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
        }

        throw new Error(data.message || "ตรวจสอบสิทธิ์ไม่สำเร็จ");
      }

      await C_PRCxLoadSettingsList();
      setIsAuthorized(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAuthenticating(false);
    }
  };

  const C_PRCxSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPart = C_GETtNormalizedPathPart(part);
    const normalizedDatabase = C_GETtNormalizedDatabaseName(database);
    const normalizedServer = server.trim();
    const normalizedPort = port.trim();
    const normalizedDbUser = dbUser.trim();

    setError("");
    setSaved("");

    if (!SAFE_PART.test(normalizedPart)) {
      setError("พาร์ทใช้ได้เฉพาะตัวอักษร ตัวเลข จุด _ และ -");
      return;
    }

    if (RESERVED_PARTS.has(normalizedPart.toLowerCase())) {
      setError("พาร์ทนี้ชนกับ route ของระบบ กรุณาใช้ชื่ออื่น");
      return;
    }

    if (!SAFE_DATABASE.test(normalizedDatabase)) {
      setError("ฐานข้อมูลใช้ได้เฉพาะตัวอักษร ตัวเลข จุด _ และ -");
      return;
    }

    if (!SAFE_SERVER.test(normalizedServer)) {
      setError("IP/Server ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด _ และ -");
      return;
    }

    if (normalizedPort) {
      const portNumber = Number(normalizedPort);
      if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
        setError("Port ต้องเป็นตัวเลข 1-65535");
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch(`${C_GETtBasePath()}/api/database-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser,
          password: adminPassword,
          oldPart: editingPart,
          part: normalizedPart,
          database: normalizedDatabase,
          server: normalizedServer,
          port: normalizedPort,
          dbUser: normalizedDbUser,
          dbPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
        }

        throw new Error(data.message || "บันทึกการตั้งค่าไม่สำเร็จ");
      }

      C_SEToDatabaseSettings(normalizedPart, normalizedDatabase);
      const renamedPart = editingPart && editingPart !== normalizedPart ? editingPart : "";
      const clientDataCleared = renamedPart ? await C_CLRxPartBrowserState(renamedPart) : true;
      setPart(normalizedPart);
      setDatabase(normalizedDatabase);
      setServer(normalizedServer);
      setPort(normalizedPort);
      setDbUser(normalizedDbUser);
      setDbPassword("");
      setSaved(clientDataCleared
        ? "บันทึกการตั้งค่าเรียบร้อย"
        : "บันทึกการตั้งค่าเรียบร้อย แต่ข้อมูล Offline เดิมยังเปิดใช้อยู่ในแท็บอื่น กรุณาปิดแท็บเดิม");
      setShowAddForm(false);
      setEditingPart("");
      setEditingIsDefault(false);
      await C_PRCxLoadSettingsList();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const C_GEToDefaultSetting = () => {
    return settingsList.find((item) => item.isDefault) || settingsList[0] || null;
  };

  const C_PRCxOpenAddForm = () => {
    const defaultSetting = C_GEToDefaultSetting();
    setPart("");
    setDatabase("");
    setServer(defaultSetting?.server || "");
    setPort(defaultSetting?.port ? String(defaultSetting.port) : "");
    setDbUser(defaultSetting?.user || "");
    setDbPassword("");
    setEditingPart("");
    setEditingIsDefault(false);
    setError("");
    setSaved("");
    setShowAddForm(true);
  };

  const C_PRCxOpenEditForm = (item: DatabaseSetting) => {
    setPart(item.part);
    setDatabase(item.database);
    setServer(item.server || "");
    setPort(item.port ? String(item.port) : "");
    setDbUser(item.user || "");
    setDbPassword("");
    setEditingPart(item.part);
    setEditingIsDefault(Boolean(item.isDefault));
    setError("");
    setSaved("");
    setShowAddForm(true);
  };

  const C_PRCxDeleteSettings = async (item: DatabaseSetting) => {
    if (item.isDefault) {
      setError("ไม่สามารถลบ Default จาก .env.local ได้ ให้แก้ที่ไฟล์ .env.local แทน");
      return;
    }

    if (!confirm(`ต้องการลบพาร์ท "${item.part}" หรือไม่?`)) {
      return;
    }

    setError("");
    setSaved("");
    try {
      const response = await fetch(`${C_GETtBasePath()}/api/database-settings/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser,
          password: adminPassword,
          part: item.part,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
        }

        throw new Error(data.message || "ลบการตั้งค่าไม่สำเร็จ");
      }

      const clientDataCleared = await C_CLRxPartBrowserState(item.part);

      setShowAddForm(false);
      setEditingPart("");
      setEditingIsDefault(false);
      setSaved(clientDataCleared
        ? "ลบการตั้งค่าเรียบร้อย"
        : "ลบการตั้งค่าเรียบร้อย แต่ข้อมูล Offline เดิมยังเปิดใช้อยู่ในแท็บอื่น กรุณาปิดแท็บเดิม");
      await C_PRCxLoadSettingsList();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const C_GETtFallbackText = (value: string | number | null) => {
    return value ? String(value) : "";
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 p-1 sm:p-2">
      <div className="w-full rounded-lg bg-white p-4 shadow-lg sm:p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <FaDatabase size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าพาร์ท/ฐานข้อมูล</h1>
        </div>

        {!isAuthorized ? (
          <form onSubmit={C_PRCxUnlockSettings} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">ชื่อผู้ดูแลระบบ</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full rounded-md border py-2 pl-10 pr-3 focus:outline-none focus:ring focus:border-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">รหัสผ่านผู้ดูแลระบบ</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-md border py-2 pl-10 pr-3 focus:outline-none focus:ring focus:border-blue-400"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-blue-500 py-2 font-bold text-white hover:bg-blue-600 disabled:bg-blue-300"
              disabled={authenticating}
            >
              {authenticating ? "กำลังตรวจสอบ..." : "เข้าสู่หน้าตั้งค่า"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              เข้าสู่ระบบตั้งค่าแล้ว: {adminUser}
            </div>

            <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
              ค่า Default ของ Path/Database จะดึงจาก `.env.local` ก่อน ส่วนรายการที่เพิ่มภายหลังจะ map ตาม URL path ตอน login
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-800">พาร์ท/ฐานข้อมูลที่มีอยู่</h2>
                <button
                  type="button"
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                  onClick={C_PRCxOpenAddForm}
                >
                  เพิ่ม
                </button>
              </div>

              {loadingSettings ? (
                <div className="rounded-md border px-3 py-4 text-center text-sm text-gray-500">กำลังโหลด...</div>
              ) : settingsList.length > 0 ? (
                <div className="w-full overflow-x-auto rounded-md border">
                  <table className="w-full min-w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="w-12 px-3 py-2 text-center font-bold">สถานะ</th>
                        <th className="w-14 px-3 py-2 font-bold">ลำดับ</th>
                        <th className="min-w-[220px] px-3 py-2 font-bold">พาร์ท</th>
                        <th className="min-w-[140px] px-3 py-2 font-bold">IP/Server</th>
                        <th className="w-20 px-3 py-2 font-bold">Port</th>
                        <th className="min-w-[180px] px-3 py-2 font-bold">ฐานข้อมูล</th>
                        <th className="w-20 px-3 py-2 font-bold">User</th>
                        <th className="w-28 px-3 py-2 font-bold">Password</th>
                        <th className="sticky right-0 z-10 min-w-[188px] bg-gray-50 px-3 py-2 text-center font-bold shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.15)]">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {settingsList.map((item, index) => (
                        <tr key={item.part} className="border-t align-top">
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-block h-3 w-3 rounded-full ${
                                item.connected ? "bg-green-500" : "bg-red-500"
                              }`}
                              title={item.connected ? "เชื่อมต่อได้" : "เชื่อมต่อไม่ได้"}
                              aria-label={item.connected ? "เชื่อมต่อได้" : "เชื่อมต่อไม่ได้"}
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 font-bold text-gray-900">
                            <div className="space-y-1">
                              <div className="break-all">{item.part}</div>
                              {item.isDefault && (
                                <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-700">
                                  Default (.env.local)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="break-all px-3 py-2 text-gray-700">{C_GETtFallbackText(item.server)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{C_GETtFallbackText(item.port)}</td>
                          <td className="break-all px-3 py-2 text-gray-700">{item.database}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{C_GETtFallbackText(item.user)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{item.hasPassword ? "ตั้งค่าแล้ว" : ""}</td>
                          <td className="sticky right-0 z-10 bg-white px-3 py-2 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.15)]">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                className="min-w-[84px] whitespace-nowrap rounded-md border border-blue-300 px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50"
                                onClick={() => C_PRCxOpenEditForm(item)}
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                className="min-w-[84px] whitespace-nowrap rounded-md border border-red-300 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => C_PRCxDeleteSettings(item)}
                                disabled={item.isDefault}
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-md border px-3 py-4 text-center text-sm text-gray-500">
                  ยังไม่มีรายการ — ตรวจสอบ `.env.local` ว่ามี `NEXT_PUBLIC_BASE_PATH`, `NAME_DB`, `SERVER_DB`, `PORT_DB`, `USER_DB`, `PASSWORD_DB` แล้วรัน build + restart PM2 ใหม่
                </div>
              )}
            </div>

            {showAddForm && (
              <form onSubmit={C_PRCxSaveSettings} className="space-y-4 rounded-md border p-4">
                <h3 className="font-bold text-gray-800">
                  {editingPart ? "แก้ไขพาร์ท/ฐานข้อมูล" : "เพิ่มพาร์ท/ฐานข้อมูล"}
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">พาร์ท</label>
                    <input
                      type="text"
                      value={part}
                      onChange={(e) => setPart(e.target.value)}
                      readOnly={editingIsDefault}
                      placeholder="AdaCheckStockSTD"
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">ฐานข้อมูล</label>
                    <input
                      type="text"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="AdaAccSTD_ByAgent"
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">IP/Server Database</label>
                    <input
                      type="text"
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      placeholder="IP หรือชื่อ Server"
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Port</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="1433"
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">User Database</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder="User สำหรับ Database"
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Password Database</label>
                    <input
                      type="password"
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      placeholder={editingPart ? "กรอกรหัสผ่านใหม่เมื่อต้องการเปลี่ยน" : "Password Database"}
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="w-1/2 rounded-md border border-gray-300 py-2 font-bold text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPart("");
                      setEditingIsDefault(false);
                      setError("");
                      setSaved("");
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-md bg-blue-500 py-2 font-bold text-white hover:bg-blue-600 disabled:bg-blue-300"
                    disabled={saving}
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {saved && <p className="text-sm text-green-600">{saved}</p>}

            <button
              type="button"
              className="w-full rounded-md border border-gray-300 py-2 font-bold text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setIsAuthorized(false);
                setShowAddForm(false);
                setAdminPassword("");
                setError("");
                setSaved("");
              }}
            >
              ออกจากหน้าตั้งค่า
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
