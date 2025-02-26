"use client";
import { useAuth } from "@/hooks/useAuth";

export default function StockPage() {
  // เช็ค user login
  useAuth();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <h3 className="text-2xl mt-4">StockPage</h3>
        <p className="text-gray-500">เข้าสู่หน้า StockPage</p>
      </div>
    </div>
  );
}