"use client";
import { useEffect, useRef, useState } from "react";
import { CiWifiOn, CiWifiOff } from "react-icons/ci";
import { RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import { C_REQxAppRepair } from "@/hooks/CAppUpdate";

export default function NetworkStatus({ updatesDisabled = false }: { updatesDisabled?: boolean }) {
  const isOnline = useNetworkStatus();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [supported, setSupported] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => { setSupported(process.env.NODE_ENV === "production" && "serviceWorker" in navigator); }, []);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, confirming]);

  const update = () => {
    setOpen(false);
    trigger.current?.focus();
    C_REQxAppRepair(true);
  };

  return (
    <div ref={container} className="fixed bottom-4 right-4 z-[110]"
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
      {open && <div ref={panel} id="network-status-menu" role="dialog" aria-label={confirming ? "ยืนยันการอัปเดต" : "สถานะเครือข่าย"} tabIndex={-1}
        className="absolute bottom-full right-0 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-gray-200 bg-white p-2 text-gray-800 shadow-lg outline-none">
        {confirming ? <div className="p-2 text-sm leading-6">
          <h2 className="font-semibold">อัปเดตและล้าง Cache เก่า?</h2>
          <p className="mt-2">ดาวน์โหลดและตรวจสอบไฟล์ใหม่ก่อนล้าง Cache ไฟล์แอปเก่าเฉพาะ Part นี้</p>
          <p className="mt-2">ไม่ลบงาน Offline รายการที่ยังไม่ส่ง หรือข้อมูลเข้าสู่ระบบ</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }}
              className="rounded border border-gray-300 px-3 py-2 hover:bg-gray-100">ยกเลิก</button>
            <button type="button" onClick={update} disabled={!isOnline || !supported || updatesDisabled}
              className="flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-40">
              <RefreshCw size={16} className="shrink-0" aria-hidden="true" />ยืนยันอัปเดต
            </button>
          </div>
        </div> : <>
        <p className="px-2 py-1 text-xs text-gray-500">{isOnline ? "ออนไลน์" : "ออฟไลน์"}</p>
        <button type="button" onClick={() => setConfirming(true)} disabled={!isOnline || !supported || updatesDisabled}
          title={!isOnline ? "ต้องเชื่อมต่อเครือข่ายก่อนอัปเดต" : !supported || updatesDisabled ? "หน้านี้ยังไม่พร้อมสำหรับการอัปเดต" : "อัปเดตและล้าง Cache เก่า"}
          className="flex w-full items-center gap-2 rounded p-2 text-left text-sm leading-6 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
          <RefreshCw size={18} className="shrink-0" aria-hidden="true" />
          <span>อัปเดตและล้าง Cache เก่า</span>
        </button>
        </>}
      </div>}
      <button ref={trigger} type="button" aria-label="สถานะเครือข่ายและอัปเดต" aria-expanded={open}
        aria-controls="network-status-menu" aria-haspopup="dialog" title={isOnline ? "ออนไลน์: เปิดเมนูอัปเดต" : "ออฟไลน์: เปิดเมนูอัปเดต"}
        onClick={() => { setConfirming(false); setOpen(value => !value); }}
        className="flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
        {isOnline ? <CiWifiOn className="text-green-500" aria-hidden="true" /> : <CiWifiOff className="text-red-500" aria-hidden="true" />}
      </button>
    </div>
  );
}
