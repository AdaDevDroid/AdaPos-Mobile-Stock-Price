"use client";
import { CiWifiOn, CiWifiOff } from "react-icons/ci";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";

export default function NetworkStatus() {
  const isOnline = useNetworkStatus();

  console.log("status" + isOnline);
  return (
    <div className="fixed bottom-4 right-4 flex items-center bg-white p-2 shadow-md rounded-md">
      {isOnline ? (
        <>
          <CiWifiOn className="text-green-500 mr-2" />
          <span className="text-green-500 text-sm">Online</span>
        </>
      ) : (
        <>
          <CiWifiOff className="text-red-500 mr-2" />
          <span className="text-red-500 text-sm">Offline</span>
        </>
      )}
    </div>
  );
}