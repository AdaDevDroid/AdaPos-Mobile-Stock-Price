"use client";

import { useEffect } from "react";
import { C_CLRxPartSession, C_GETtActiveDatabasePart, C_GETtPartUrl, C_GETxPartSession } from "@/hooks/CDatabaseSettings";

export function useAuth() {
  useEffect(() => {
    const redirectToLogin = () => {
      C_CLRxPartSession();
      window.location.href = C_GETtPartUrl("/login");
    };

    const checkAuth = () => {
      try {
        const { token: cachedToken, expiry: tokenExpiry, part: sessionPart } = C_GETxPartSession();

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
