import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export const CCameraScanner = (onScan: (ptDecodedText: string) => void) => {
  const [bScanning, setIsScanning] = useState(false);
  const oHtml5QrCode = useRef<Html5Qrcode | null>(null);
  const oScannerRef = useRef<HTMLDivElement | null>(null);

  const C_GETxQrBoxSize = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth > 1024) return { width: 400, height: 250 }; // Desktop
    if (screenWidth > 768) return { width: 300, height: 180 }; // Tablet
    return { width: 250, height: 150 }; // Mobile
  };

  const C_PRCxStartScanner = async () => {
    try {
      if (bScanning && oHtml5QrCode.current) {
        await oHtml5QrCode.current.stop();
        console.log("📴 Scanner stopped");
        setIsScanning(false);
        oHtml5QrCode.current = null;
        return;
      }
  
      if (!oScannerRef.current || oHtml5QrCode.current) return;
  
      const qrScanner = new Html5Qrcode("reader");
  
      await qrScanner.start(
        { facingMode: "environment" },  // ใช้กล้องหลัง
        { fps: 10, qrbox: C_GETxQrBoxSize() },
        (decodedText) => {
          try {
            onScan(decodedText);
          } catch (error) {
            console.error("Error in scan callback:", error);
          }
        },
        (errorMessage) => {
          console.error("QR Code scan error:", errorMessage);
        }
      );
  
      console.log("✅ Scanner started");
      oHtml5QrCode.current = qrScanner;
      setIsScanning(true);
    } catch (error) {
      console.error("🚨 Error starting scanner:", error);
    }
  };

  const C_PRCxPauseScanner = () => {
    if (oHtml5QrCode.current) {
      oHtml5QrCode.current.pause(true);
      console.log("⏸ Scanner paused");
    }
  };

  const C_PRCxResumeScanner = () => {
    if (oHtml5QrCode.current) {
      oHtml5QrCode.current.resume();
      console.log("▶ Scanner resumed");
    }
  };

  const C_PRCxStopScanner = () => {
    if (oHtml5QrCode.current) {
      oHtml5QrCode.current.stop().then(() => {
        console.log("📴 Scanner stopped");
        setIsScanning(false);
        oHtml5QrCode.current = null;
  
        // ✅ ดึง video stream ที่กำลังใช้งานอยู่ แล้วปิดกล้อง
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          devices
            .filter((device) => device.kind === "videoinput") // เลือกเฉพาะกล้อง
            .forEach(async (device) => {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } });
              stream.getTracks().forEach((track) => track.stop()); // 🔥 ปิด track ของกล้องที่เปิดอยู่จริง
              console.log("📸 Camera stream stopped");
            });
        });
  
      }).catch((err) => console.error("Error stopping scanner:", err));
    }
  };

  return { C_PRCxStartScanner, C_PRCxStopScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef };
};