"use client";

import InputWithButton from "@/components/InputWithButton";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { useAuth } from "@/hooks/useAuth";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory } from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";
import { FiCamera, FiCameraOff } from "react-icons/fi";


interface Product {
  id: number;
  barcode: string;
  cost: number;
  quantity: number;
}

export default function ReceiveGoods() {
  const [refDoc, setRefDoc] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [searchText, setSearchText] = useState<string>(""); // string
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);

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

  useEffect(() => {
    if (isScanning && html5QrCode) {
      html5QrCode.stop().then(() => {
        console.log("Scanner stopped due to checked state change");
        setIsScanning(false);
        setHtml5QrCode(null);
      });
    }
  }, [checked]);

  useEffect(() => {
    if (pendingBarcode !== null) {
      addProduct(pendingBarcode); // ✅ รอจน `cost` เปลี่ยนก่อนค่อยทำงาน
      setPendingBarcode(null);
    }
  }, [cost]);

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
          { fps: 10, qrbox: { width: 300, height: 150 } },
          (decodedText) => {
            if (checked) {
              setBarcode(decodedText);
              alert(`เพิ่มข้อมูล: ${decodedText}`);
              addProduct(decodedText);
            } else {
              setBarcode(decodedText);
              alert(`ข้อความ: ${decodedText}`);
            }
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

  const addProduct = (barcode: string) => {
    if (!cost) {
      setCost("0");
      setPendingBarcode(barcode); // รอให้ cost อัปเดตก่อน
      return;
    }

    if (!barcode || !quantity) return;

    setProducts((prevProducts) => {
      const newId = Math.max(...prevProducts.map(p => p.id), 0) + 1; //หา ID สูงสุดแล้ว +1

      const newProduct = {
        id: newId, // ใช้ ID ใหม่ที่ไม่ซ้ำ
        barcode,
        cost: parseFloat(cost),
        quantity: parseInt(quantity),
      };

      return [...prevProducts, newProduct];
    });

    setBarcode("");
    setCost("");
    setQuantity("1");
  };

  const removeProduct = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .filter((product) => product.id !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );
  };

  return (
    <div className="p-4 ms-1 mx-auto bg-white">

      <div className="flex flex-col md:flex-row items-start md:items-center pb-6">

        <div className="flex flex-row w-full py-2">
          {/* หัวข้อ */}
          <h1 className="text-2xl font-bold md:pb-0">รับสินค้าจากผู้จำหน่าย</h1>

          {/* ปุ่ม 3 จุด จอเล็ก */}
          <button
            className="md:hidden ml-2 p-2 rounded-md ml-auto text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>
        {/* ค้นหา PO และปุ่ม 3 จุด (สำหรับ desktop) */}
        <div className="flex w-full md:w-80 md:ml-auto pt-2 relative">
          <InputWithButton
            type="text"
            value={searchText}
            onChange={setSearchText}
            placeholder="ค้นหาใบ PO"
            icon={<GrDocumentText />}
            onClick={() => alert(`ข้อความ: ${searchText}`)}
          />
          {/* ปุ่ม 3 จุด */}
          <button
            className="hidden md:block ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-4 top-6 mt-12 bg-white border shadow-lg rounded-md w-auto text-[16px]">
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => alert(`ข้อความ: อัพโหลดผ่าน Web Services`)}
            >
              <FaFileAlt className="mr-2 text-gray-700" /> อัพโหลดผ่าน Web Services2
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => alert(`ข้อความ: ส่งออกเป็น File Excel`)}
            >
              <FaDownload className="mr-2 text-gray-700" /> ส่งออกเป็น File Excel
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => alert(`ข้อความ: ประวัติการทำรายการ`)}
            >
              <FaHistory className="mr-2 text-gray-700" /> ประวัติการทำรายการ
            </button>
          </div>
        )}
      </div>

      {/* กรอกข้อมูล */}
      <div className="space-y-4 pt-4">

        <InputWithLabel
          type="text"
          label={"เลขที่อ้างอิง"}
          icon={<FaRegCalendar />}
          value={refDoc}
          onChange={setRefDoc}
          placeholder="ระบุเลขที่อ้างอิงจาก Supplier"
        />

        {/* ตัวสแกน QR Code พร้อมกรอบ */}
        <div
          id="reader"
          ref={scannerRef}
          className={`my-4 relative flex items-center justify-center w-[50%] mx-auto ${isScanning ? "h-[50%]" : "h-[0px] pointer-events-none"
            } transition-opacity duration-300`}
        >
        </div>


        <InputWithLabelAndButton
          type="text"
          label={"บาร์โค้ด"}
          value={barcode}
          onChange={setBarcode}
          icon={isScanning ? <FiCameraOff /> : <FiCamera />}
          placeholder="สแกนหรือป้อนบาร์โค้ด"
          onClick={startScanner}
        />

        <InputWithLabel
          type="text"
          label={"ต้นทุน"}
          value={cost}
          onChange={setCost}
          placeholder="ระบุต้นทุน (ถ้ามี)"
        />

        <InputWithLabelAndButton
          type="number"
          value={quantity}
          onChange={setQuantity}
          label={"จำนวนที่ได้รับ"}
          icon={<FaPlus />}
          onClick={() => addProduct(barcode)}
        />
      </div>

      {/* ตารางสินค้า */}
      <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 border text-m text-[14px]">
            <th className="p-2">ลำดับ</th>
            <th className="p-2">บาร์โค้ด</th>
            <th className="p-2">ต้นทุน</th>
            <th className="p-2">จำนวน</th>
            <th className="p-2">จัดการ</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {products.map((product) => (
            <tr key={product.id} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{product.id}</td>
              <td className="p-2">{product.barcode}</td>
              <td className="p-2">฿{product.cost.toFixed(2)}</td>
              <td className="p-2">{product.quantity}</td>
              <td className="p-2">
                <button onClick={() => removeProduct(product.id)} className="text-red-500">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col md:flex-row items-start md:items-center mt-4 ">
        {/* จำนวนรายการ */}
        <p className="text-gray-500 text-[14px]">จำนวนรายการ: {products.length} รายการ</p>

        <div className="flex w-full md:w-auto md:ml-auto pt-2 relative">
          <label className="flex items-center text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setChecked(!checked)}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-[14px]">บันทึกอัตโนมัติหลังสแกนบาร์โค้ด</span>
          </label>
        </div>
      </div>
    </div>
  );
}

