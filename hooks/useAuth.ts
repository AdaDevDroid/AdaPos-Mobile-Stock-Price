"use client";

import { useEffect } from "react";
import { C_GETtPartUrl } from "@/hooks/CDatabaseSettings";

export function useAuth() {
  useEffect(() => {
    const redirectToLogin = () => {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_expiry");
      window.location.href = C_GETtPartUrl("/login");
    };

    const checkAuth = () => {
      try {
        const cachedToken = localStorage.getItem("session_token");
        const tokenExpiry = localStorage.getItem("session_expiry");

        if (!cachedToken || !tokenExpiry) {
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
