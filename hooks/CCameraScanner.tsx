import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export const CCameraScanner = (onScan: (ptDecodedText: string) => void) => {
  const [bScanning, setIsScanning] = useState(false);
  const oHtml5QrCode = useRef<Html5Qrcode | null>(null);
  const oScannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function C_PRCxRequestCameraPermission() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera permission granted");
      } catch (error) {
        console.error("Camera permission denied", error);
      }
    }
    C_PRCxRequestCameraPermission();
  }, []);

  const C_GETxQrBoxSize = () => {
    const screenWidth = window.innerWidth;
  
    if (screenWidth > 1024) {
      return { width: 400, height: 250 }; // สำหรับคอมพิวเตอร์
    } else if (screenWidth > 768) {
      return { width: 300, height: 180 }; // สำหรับแท็บเล็ต
    } else {
      return { width: 250, height: 150 }; // สำหรับมือถือ
    }
  };

  const C_PRCxStartScanner = () => {
    if (bScanning && oHtml5QrCode.current) {
      // 🔴 หยุดสแกน
      oHtml5QrCode.current
        .stop()
        .then(() => {
          console.log("📴 Scanner stopped");
          setIsScanning(false);
          oHtml5QrCode.current = null;
        })
        .catch((err) => console.error("Error stopping scanner:", err));
    } else {
      if (!oScannerRef.current) return;
      if (oHtml5QrCode.current) return;

      const qrScanner = new Html5Qrcode("reader");

      qrScanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: C_GETxQrBoxSize() },
          (decodedText) => {
            try {
              onScan(decodedText);
            } catch (error) {
              console.error("Error in scan callback:", error);
            }
          },
          (error) => error
        )
        .then(() => {
          oHtml5QrCode.current = qrScanner;
          setIsScanning(true);
        })
        .catch((err) => console.error("Error starting scanner:", err));
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


  return { C_PRCxStartScanner,C_PRCxPauseScanner,C_PRCxResumeScanner, bScanning, oScannerRef };
};