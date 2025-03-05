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
          { fps: 10, qrbox: { width: 300, height: 150 } },
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

  return { C_PRCxStartScanner, bScanning, oScannerRef };
};