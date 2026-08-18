"use client";

import { useEffect, useState } from "react";
import { C_CLRxPartSession, C_GETtActiveDatabasePart, C_GETtPartUrl, C_GETxPartSession } from "@/hooks/CDatabaseSettings";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToLogin = () => {
      C_CLRxPartSession();
      setLoading(false);
      window.location.replace(C_GETtPartUrl("/login"));
    };

    const { token: cachedToken, expiry: tokenExpiry, part: sessionPart } = C_GETxPartSession();

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
