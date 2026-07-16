"use client";

import { useEffect } from "react";
import { C_GETtActiveDatabasePart, C_GETtPartUrl, SESSION_PART_STORAGE_KEY } from "@/hooks/CDatabaseSettings";

export function useAuth() {
  useEffect(() => {
    const redirectToLogin = () => {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_expiry");
      localStorage.removeItem(SESSION_PART_STORAGE_KEY);
      window.location.href = C_GETtPartUrl("/login");
    };

    const checkAuth = () => {
      try {
        const cachedToken = localStorage.getItem("session_token");
        const tokenExpiry = localStorage.getItem("session_expiry");
        const sessionPart = localStorage.getItem(SESSION_PART_STORAGE_KEY);

        if (!cachedToken || !tokenExpiry || sessionPart !== C_GETtActiveDatabasePart()) {
          redirectToLogin();
          return;
        }

        const nowMinutes = Math.floor(Date.now() / 1000 / 60);
        const expiryMinutes = Number(tokenExpiry);

        if (!Number.isFinite(expiryMinutes) || nowMinutes > expiryMinutes) {
          redirectToLogin();
        }
      } catch {
        redirectToLogin();
      }
    };

    checkAuth();

    const tokenCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, []);
}
