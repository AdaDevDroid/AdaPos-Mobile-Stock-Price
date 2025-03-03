"use client";
import { useState, useRef, useEffect } from "react";
import { FaCamera, FaPlus, FaRegCalendar } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/hooks/useAuth";
import InputWithButton from "@/components/InputWithButton";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";

export default function ScanPage() {
  const [testNumber, setTestNumber] = useState(0);
  const [testText, setTestText] = useState("");
  const [barcode, setBarcode] = useState("");
  const scannerRef = useRef<HTMLDivElement | null>(null);

  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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

  // const startScanner = () => {
  //   if (!scannerRef.current) return;

  //   const html5QrCode = new Html5QrcodeScanner("reader", {
  //     fps: 10,
  //     qrbox: {
  //       width: 200,  // กำหนดความกว้างของกรอบสแกน
  //       height: 100,
  //     }, // ขยายขนาดกรอบสแกน (สามารถเพิ่มขนาดได้ตามต้องการ)
  //   }, false);

  //   html5QrCode.render(
  //     (decodedText) => {
  //       setBarcode(decodedText);
  //       html5QrCode.clear();
  //     },
  //     (error) => {
  //       console.log(error);
  //     }
  //   );
  // };

  const startScanner = () => {
    if (isScanning && html5QrCode) {
      // 🔴 หยุดสแกนเมื่อกดปุ่มอีกครั้ง
      html5QrCode
        .stop()
        .then(() => {
          console.log("📴 Scanner stopped");
          setIsScanning(false);
          setHtml5QrCode(null); // รีเซ็ต instance
        })
        .catch((err) => console.error("Error stopping scanner:", err));
    } else {
      // 🟢 เปิดกล้องเมื่อกดปุ่ม
      if (!scannerRef.current) return;
      const qrScanner = new Html5Qrcode("reader");

      qrScanner
        .start(
          { facingMode: "environment" }, // ใช้กล้องหลัง
          { fps: 10, qrbox: { width: 300, height: 80 } },
          (decodedText) => {
            setBarcode(decodedText);
          },
          (error) => console.log(error)
        )
        .then(() => {
          setHtml5QrCode(qrScanner); // บันทึก instance
          setIsScanning(true);
        })
        .catch((err) => console.log("Error starting scanner:", err));
    }
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
        className={`my-4 relative w-[50%] ${isScanning ? "h-[100%]" : "h-[0px]"} transition-opacity duration-300`}
      >
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white p-2 rounded-md flex items-center justify-center"
      >
        <CiLogout className="text-xl" />
      </button>


      {/*สอนใช้ Companent กลาง*/}

      <div className="flex flex-col gap-4">

        {/* Input + Button แบบ Number */}
        <InputWithButton
          type="number"
          value={testNumber}
          onChange={setTestNumber}
          icon={<FaPlus />}
          onClick={() => alert(`เพิ่มจำนวน: ${testNumber}`)}
        />

        {/* Input + Button แบบ Text */}
        <InputWithButton
          type="text"
          value={testText}
          onChange={setTestText}
          icon={<FaPlus />}
          onClick={() => alert(`ข้อความ: ${testText}`)}
        />

        {/* Input + label+icon */}
        <InputWithLabel
          type="text"
          label={"เลขที่อ้างอิง"}
          icon={<FaRegCalendar />}
          value={testText}
          onChange={setTestText}
          placeholder="ระบุเลขที่อ้างอิงจาก Supplier"
        />

        {/* Input + label */}
        <InputWithLabel
          type="number"
          label={"ต้นทุน"}
          value={testNumber}
          onChange={setTestNumber}
          placeholder="ระบุต้นทุน (ถ้ามี)"
        />

        <InputWithLabelAndButton
          value={testText}
          onChange={setTestText}
          label={"testTT"}
          icon={<FaPlus />}
          onClick={() => alert(`ข้อความ: ${testText}`)}
        />

      </div>





    </div>
  );
}