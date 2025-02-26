"use client";
import { useState, useRef, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAuth } from "@/hooks/useAuth";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const scannerRef = useRef<HTMLDivElement | null>(null);

  // เช็ค user login
  useAuth();
  // ✅ ขอ permission กล้องเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    async function requestCameraPermission() {
      
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("✅ Camera permission granted");
      } catch (error) {
        console.error("❌ Camera permission denied", error);
      }
    }
    requestCameraPermission();
  }, []);

  const startScanner = () => {
    if (!scannerRef.current) return;

    const html5QrCode = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: {
        width: 200,  // กำหนดความกว้างของกรอบสแกน
        height: 100,
      }, // ขยายขนาดกรอบสแกน (สามารถเพิ่มขนาดได้ตามต้องการ)
    }, false);

    html5QrCode.render(
      (decodedText) => {
        setBarcode(decodedText);
        html5QrCode.clear();
      },
      (error) => {
        console.log(error);
      }
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <h3 className="text-2xl mt-4">Main Page</h3>
        <p className="text-gray-500">เข้าสู่หน้า Main</p>
      </div>

      {/* Text Input และ ปุ่มแสกนกล้อง */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="สแกน Barcode หรือพิมพ์เอง"
          className="border p-2 rounded-md w-60"
        />
        <button
          onClick={startScanner}
          className="bg-blue-500 text-white p-2 rounded-md flex items-center justify-center"
        >
          <FaCamera className="text-xl" />
        </button>
      </div>

      {/* ตัวสแกน QR Code พร้อมกรอบ */}
      <div
        id="reader"
        ref={scannerRef}
        className="mt-4 relative w-[500px] h-[200px]" // เพิ่มขนาดของ div ที่รับการแสดงกล้อง
      >
      </div>

      <button
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded-md flex items-center justify-center"
        >
          <CiLogout className="text-xl" />
        </button>
    </div>
  );
}