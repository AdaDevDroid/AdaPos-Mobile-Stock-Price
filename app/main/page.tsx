"use client";
import { useAuth } from "@/hooks/useAuth";
export default function MainPage() {
  // เช็ค user login
  useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex p-4 justify-between items-center shadow-sm">
        <span className="text-l ml-auto">ชื่อผู้ใช้งาน : soma</span>
      </div>
    </div>
  );
}
