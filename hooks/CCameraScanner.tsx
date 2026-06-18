import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";


export const CCameraScanner = (onScan: (ptDecodedText: string) => void) => {
  const [bScanning, setIsScanning] = useState(false);
  const oHtml5QrCode = useRef<Html5Qrcode | null>(null);
  const oScannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (oHtml5QrCode.current) {
        oHtml5QrCode.current.stop().then(() => {
          console.log("📴 Scanner auto-stopped from hook cleanup");
          setIsScanning(false);
          oHtml5QrCode.current = null;
        }).catch((err) => console.log("🚨 Failed to auto-stop:", err));
      }
    };
  }, []);

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
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: C_GETxQrBoxSize(),
        },
        (decodedText, decodedResult) => {
          const formatName = decodedResult?.result?.format?.formatName;
  
          const allowedFormats = ["EAN_13", "CODE_128", "CODE_39", "UPC_A", "UPC_E"];
  
          if (formatName && allowedFormats.includes(formatName)) {
            console.log("✅ Barcode Scanned:", decodedText, `(${formatName})`);
            onScan(decodedText);
          } else {
            console.log("❌ Ignored format:", formatName);
          }
        },
        (errorMessage) => {
           console.log("Error:", errorMessage);
        }
      );
  
  
      console.log("✅ Scanner started");
      oHtml5QrCode.current = qrScanner;
      setIsScanning(true);
    } catch (error) {
      console.log("🚨 Error starting scanner:", error);
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
            .filter((device) => device.kind === "videoinput")
            .forEach(async () => {

              navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                  stream.getTracks().forEach((track) => track.stop());
                  console.log("📸 Camera stream stopped");
                })
                .catch((err) => {
                  console.log("❌ Could not stop camera stream", err);
                });
                
            });
        });
  
      }).catch((err) => console.log("Error stopping scanner:", err));
    }
  };

  return { C_PRCxStartScanner, C_PRCxStopScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef };
};
