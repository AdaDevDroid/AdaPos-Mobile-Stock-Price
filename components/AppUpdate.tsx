"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { APP_BUILD_ID, C_GETtServiceWorkerUrl } from "@/hooks/CDatabaseSettings";
import { AppRelease, C_CANxApplyUpdate, C_GETxServerRelease, C_MSGxWorker, C_WAITxReleaseWorker } from "@/hooks/CAppUpdate";

export default function AppUpdate({ basePath, disabled }: { basePath: string; disabled: boolean }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [retry, setRetry] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (disabled || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let checking = false;
    let manualPending = false;
    let target = "";
    let lockTimer: ReturnType<typeof setTimeout>;
    let autoAttempted = "";
    let registration: ServiceWorkerRegistration | undefined;
    const unlock = () => {
      target = "";
      clearTimeout(lockTimer);
      document.getElementById("app-content")?.removeAttribute("inert");
      if (!disposed) setLocked(false);
    };
    const handleMessage = (event: MessageEvent) => {
      if (!event.source || ![registration?.active, registration?.waiting, navigator.serviceWorker.controller].includes(event.source as ServiceWorker)) return;
      const data = event.data;
      if (data?.type === "GET_CLIENT_BUILD") event.ports[0]?.postMessage({ buildId: APP_BUILD_ID });
      if (data?.type === "PREPARE_UPDATE") {
        const ready = C_CANxApplyUpdate();
        if (ready) {
          target = data.buildId;
          document.getElementById("app-content")?.setAttribute("inert", "");
          setLocked(true);
          clearTimeout(lockTimer);
          lockTimer = setTimeout(unlock, 15000);
        }
        event.ports[0]?.postMessage({ ready, buildId: APP_BUILD_ID });
      }
      if (data?.type === "CANCEL_UPDATE" && data.buildId === target) unlock();
      if (data?.type === "RELOAD_UPDATE" && target === data.buildId && C_CANxApplyUpdate()) {
        const key = `adapos:${basePath}:reloaded:${target}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
        } else {
          unlock();
          setNotice("อัปเดตยังไม่สำเร็จ กรุณาปิดแท็บนี้แล้วเปิดใหม่");
        }
      }
    };
    const apply = async (worker: ServiceWorker, release: AppRelease) => {
      setBusy(true);
      try {
        const result = await C_MSGxWorker(worker, "APPLY_UPDATE", 12000);
        if (result.blocked) setNotice("มีงานค้างหรือแท็บที่ยังไม่พร้อม กรุณาบันทึกงานหรือปิดแท็บอื่นก่อนอัปเดต");
        else if (!result.applied) throw new Error("Update was not applied");
      } catch (error) {
        console.warn("Application update deferred:", error);
        unlock();
        setNotice(`ยังอัปเดตเป็น ${release.version} ไม่สำเร็จ กรุณาลองอีกครั้ง`);
      } finally { if (!disposed) setBusy(false); }
    };
    const check = async (repair = false, manual = false) => {
      if (disposed) return;
      if (!navigator.onLine) {
        if (manual) {
          setNotice("ต้องเชื่อมต่อเครือข่ายก่อนอัปเดต ยังไม่มีการล้าง Cache");
          setRetry(() => () => { void check(true, true); });
        }
        return;
      }
      if (checking) {
        if (manual) {
          manualPending = true;
          setNotice("กำลังตรวจสอบอัปเดต กรุณารอสักครู่...");
        }
        return;
      }
      checking = true;
      if (repair) setBusy(true);
      if (manual) {
        setNotice("กำลังดาวน์โหลดและตรวจสอบไฟล์แอป...");
        setRetry(null);
      }
      try {
        const release = await C_GETxServerRelease();
        if (disposed) return;
        if (release.buildId !== APP_BUILD_ID) {
          setBusy(true);
          setNotice(`กำลังเตรียมอัปเดต ${release.version}...`);
        }
        registration = await navigator.serviceWorker.register(C_GETtServiceWorkerUrl(basePath), {
          scope: `${basePath}/`, updateViaCache: "none",
        });
        await registration.update();
        const worker = await C_WAITxReleaseWorker(registration, release.buildId);
        if (disposed) return;
        let status = await C_MSGxWorker(worker, "GET_STATUS");
        if (!status.ready || repair) status = await C_MSGxWorker(worker, "REPAIR", 90000);
        if (!status.ready) throw new Error("Offline files are incomplete");
        if (manual && release.buildId === APP_BUILD_ID && worker === registration.active) {
          const result = await C_MSGxWorker(worker, "CLIENT_READY");
          setNotice(result.cleaned
            ? "ไฟล์แอปเป็นรุ่นล่าสุดแล้ว ล้าง Cache เก่าเรียบร้อย โดยเก็บงาน Offline ไว้"
            : "ไฟล์แอปพร้อมแล้ว แต่ยังเก็บ Cache เก่าไว้เนื่องจากมีแท็บรุ่นเก่า กรุณาปิดแท็บอื่นแล้วลองอีกครั้ง");
          setRetry(result.cleaned ? null : () => () => { void check(true, true); });
        } else if (release.buildId !== APP_BUILD_ID || worker === registration.waiting || repair) {
          setNotice(`พร้อมอัปเดต ${release.version}`);
          setRetry(() => () => { void apply(worker, release); });
          if (manual || (autoAttempted !== release.buildId && window.location.pathname.endsWith("/login") && C_CANxApplyUpdate())) {
            autoAttempted = release.buildId;
            await apply(worker, release);
          }
        } else {
          setNotice("");
          setRetry(null);
          worker.postMessage({ type: "CLIENT_READY" });
        }
      } catch (error) {
        console.warn("Application update check failed:", error);
        if (!disposed && (repair || navigator.onLine)) {
          setNotice("เตรียมไฟล์อัปเดตไม่สำเร็จ ยังใช้รุ่นเดิมได้");
          setRetry(() => () => { void check(true, manual); });
        }
      } finally {
        checking = false;
        if (!disposed) setBusy(false);
        if (manualPending && !disposed) {
          manualPending = false;
          void check(true, true);
        }
      }
    };
    const onCheck = () => { if (document.visibilityState === "visible") void check(); };
    const onRepair = (event?: Event) => { void check(true, event instanceof CustomEvent && event.detail?.manual === true); };
    const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "reason" in event ? event.reason : event.error || event.message;
      if (/ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(String(error))) onRepair();
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    window.addEventListener("online", onCheck);
    window.addEventListener("focus", onCheck);
    document.addEventListener("visibilitychange", onCheck);
    window.addEventListener("ada-app-repair", onRepair);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    const interval = setInterval(onCheck, 60000);
    void check();
    return () => {
      disposed = true;
      unlock();
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      window.removeEventListener("online", onCheck);
      window.removeEventListener("focus", onCheck);
      document.removeEventListener("visibilitychange", onCheck);
      window.removeEventListener("ada-app-repair", onRepair);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, [basePath, disabled]);

  return <>
    {notice && <div role="status" className="fixed bottom-24 right-3 z-[100] flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-800 shadow-md md:bottom-16 md:max-w-md">
      <span>{notice}</span>
      {(busy || retry) && <button type="button" title="อัปเดตแอป" aria-label="อัปเดตแอป" disabled={busy || locked} onClick={() => retry?.()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-300 text-blue-700 disabled:opacity-40">
        <RefreshCw size={20} className={busy ? "animate-spin" : ""} />
      </button>}
    </div>}
    {locked && <div role="alert" className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 text-gray-800">กำลังอัปเดตแอป...</div>}
  </>;
}
