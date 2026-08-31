"use client";

import { useLayoutEffect, useRef } from "react";
import { C_GETtActiveBasePath } from "./CDatabaseSettings";

const guards = new Map<object, { blocked: boolean; manualBlocked: boolean; pathname: string }>();

export function useAppUpdateGuard(blocked: boolean, manualBlocked = blocked) {
  const key = useRef({});
  useLayoutEffect(() => {
    const id = key.current;
    guards.set(id, { blocked, manualBlocked, pathname: window.location.pathname });
    return () => { guards.delete(id); };
  }, [blocked, manualBlocked]);
}

export function C_CANxApplyUpdate(manual = false) {
  const current = [...guards.values()].filter(guard => guard.pathname === window.location.pathname);
  return current.length > 0 && current.every(guard => !(manual ? guard.manualBlocked : guard.blocked));
}

export function C_REQxAppRepair(manual = false) {
  window.dispatchEvent(new CustomEvent("ada-app-repair", { detail: { manual } }));
}

export type AppRelease = { version: string; buildId: string; basePath: string };
export type WorkerReply = { buildId?: string; ready?: boolean; blocked?: boolean; applied?: boolean; cleaned?: boolean; error?: string };

export async function C_GETxServerRelease(): Promise<AppRelease> {
  const basePath = C_GETtActiveBasePath();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${basePath}/api/app-release`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Release check failed (${response.status})`);
    const release = await response.json();
    if (!release.buildId || !release.version || release.basePath !== basePath) throw new Error("Invalid release metadata");
    return release;
  } finally { window.clearTimeout(timer); }
}

export function C_MSGxWorker(worker: ServiceWorker, type: string, timeout = 8000): Promise<WorkerReply> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error(`Service worker timeout: ${type}`));
    }, timeout);
    channel.port1.onmessage = event => {
      window.clearTimeout(timer);
      channel.port1.close();
      if (event.data?.error) reject(new Error(event.data.error));
      else resolve(event.data || {});
    };
    worker.postMessage({ type }, [channel.port2]);
  });
}

export async function C_WAITxReleaseWorker(registration: ServiceWorkerRegistration, buildId: string) {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const worker = registration.waiting || (!registration.installing && registration.active);
    if (worker && ["installed", "activated"].includes(worker.state)) {
      const reply = await C_MSGxWorker(worker, "GET_STATUS", 3000).catch(() => null);
      if (reply?.buildId === buildId) return worker;
      if (reply?.buildId && !registration.installing && !registration.waiting) {
        throw new Error("New release installation failed; keeping the active build");
      }
    }
    await new Promise(resolve => window.setTimeout(resolve, 500));
  }
  throw new Error("The new build could not be prepared");
}
