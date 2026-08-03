"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { C_GETtPartUrl } from "@/hooks/CDatabaseSettings";

const NetworkStatusContext = createContext<boolean>(true);

const C_GETbServerReachable = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(C_GETtPartUrl("/api/health"), {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.ok) return true;
    } catch (error) {
      console.log("Network health check failed:", error);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return false;
};

export const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;

    const checkOnlineStatus = async () => {
      const online = await C_GETbServerReachable();
      if (active) setIsOnline(online);
    };

    const updateOnlineStatus = () => {
      void checkOnlineStatus();
    };

    const interval = window.setInterval(checkOnlineStatus, 15000);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    void checkOnlineStatus();

    return () => {
      active = false;
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={isOnline}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);
