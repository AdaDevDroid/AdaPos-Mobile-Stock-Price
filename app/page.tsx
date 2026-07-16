"use client";

import { useEffect, useState } from "react";
import { C_GETtActiveDatabasePart, C_GETtPartUrl, SESSION_PART_STORAGE_KEY } from "@/hooks/CDatabaseSettings";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToLogin = () => {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_expiry");
      localStorage.removeItem(SESSION_PART_STORAGE_KEY);
      setLoading(false);
      window.location.replace(C_GETtPartUrl("/login"));
    };

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
      return;
    }

    setLoading(false);
    window.location.replace(C_GETtPartUrl("/main"));
  }, []);

  if (loading) {
    return (
      <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-blue-500" />
      </div>
    );
  }

  return null;
}
