"use client";

import { C_GETxUserData, C_PRCxOpenIndexedDB } from "@/hooks/CIndexedDB";
import { UserInfo } from "@/models/models";
import { useState, useEffect } from "react";

export default function NameCompany() {
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await C_PRCxOpenIndexedDB();
        const data = await C_GETxUserData(database);
        if (data) {
          setUserInfo(data);
        }
      } catch (error) {
        console.error("Error initializing DB:", error);
      }
    };

    initDB();
  }, []);

  return (
    <div className="bottom-2 flex flex-col items-start bg-transparent p-2 shadow-none rounded-md">
      <span className="text-xs text-gray-400">
        บริษัท : {oUserInfo?.FTAgnName ?? ""}
      </span>
      <span className="text-xs text-gray-400">
        สาขา : {oUserInfo?.FTBchName ?? ""}
      </span>
    </div>
  );
}