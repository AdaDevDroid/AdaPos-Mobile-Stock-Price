import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export const CCameraScanner = (onScan: (ptDecodedText: string) => void) => {
  const [bScanning, setIsScanning] = useState(false);
  const oHtml5QrCode = useRef<Html5Qrcode | null>(null);
  const oScannerRef = useRef<HTMLDivElement | null>(null);
  const bStartingRef = useRef(false);
  const bStoppingRef = useRef(false);

  const C_GETxQrBoxSize = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth > 1024) return { width: 400, height: 250 }; // Desktop
    if (screenWidth > 768) return { width: 300, height: 180 }; // Tablet
    return { width: 250, height: 150 }; // Mobile
  };

  const C_PRCxStopScanner = async () => {
    if (bStoppingRef.current || !oHtml5QrCode.current) return;

    bStoppingRef.current = true;
    const scanner = oHtml5QrCode.current;

    try {
      await scanner.stop();
      scanner.clear();
      console.log("Scanner stopped");
    } catch (err) {
      console.log("Error stopping scanner:", err);
    } finally {
      if (oHtml5QrCode.current === scanner) {
        oHtml5QrCode.current = null;
      }
      setIsScanning(false);
      bStoppingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      void C_PRCxStopScanner();
    };
  }, []);

  const C_PRCxStartScanner = async () => {
    try {
      if (bStartingRef.current || bStoppingRef.current) return;

      if (bScanning && oHtml5QrCode.current) {
        void C_PRCxStopScanner();
        return;
      }

      if (!oScannerRef.current || oHtml5QrCode.current) return;

      bStartingRef.current = true;
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
            console.log("Barcode scanned:", decodedText, `(${formatName})`);
            onScan(decodedText);
          } else {
            console.log("Ignored format:", formatName);
          }
        },
        (errorMessage) => {
          console.log("Scanner error:", errorMessage);
        },
      );

      oHtml5QrCode.current = qrScanner;
      setIsScanning(true);
      console.log("Scanner started");
    } catch (error) {
      console.log("Error starting scanner:", error);
    } finally {
      bStartingRef.current = false;
    }
  };

  const C_PRCxPauseScanner = () => {
    if (oHtml5QrCode.current) {
      oHtml5QrCode.current.pause(true);
      console.log("Scanner paused");
    }
  };

  const C_PRCxResumeScanner = () => {
    if (oHtml5QrCode.current) {
      oHtml5QrCode.current.resume();
      console.log("Scanner resumed");
    }
  };

  return { C_PRCxStartScanner, C_PRCxStopScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef };
};
