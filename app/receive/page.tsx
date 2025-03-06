"use client";

import InputWithButton from "@/components/InputWithButton";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { CCameraScanner } from "@/hooks/CCameraScanner";
import { useAuth } from "@/hooks/useAuth";
import HistoryModal from "@/components/HistoryModal";
import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory } from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import exportToExcel from '@/hooks/CTransfersToExcel';
import { History, Product } from "./models"
import { C_PRCxOpenIndexedDB, C_DELxLimitData } from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";

export default function Receive() {
  const [refDoc, setRefDoc] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [searchText, setSearchText] = useState<string>(""); // string
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const checkedRef = useRef(checked);
  const costRef = useRef(cost);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<History[]>([]);
  const [oDb, setDB] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const limitData = 3;
  const isNetworkOnline = useNetworkStatus();

  // 🔹 เปิดฐานข้อมูลเมื่อ Component โหลด
  useEffect(() => {
    const initDB = async () => {
      const database = await C_PRCxOpenIndexedDB();
      setDB(database);
    };
    initDB();
  }, []);
  // 🔹 ดึงข้อมูลเมื่อ oDb ถูกเซ็ตค่า
  useEffect(() => {
    if (oDb) {
      C_PRCxFetchHistoryList();
    }
  }, [oDb]);

  // 🔹 ฟังก์ชันดึงข้อมูลจาก IndexedDB
  const C_PRCxFetchHistoryList = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }

    const transaction = oDb.transaction("TCNTHistoryReceive", "readonly");
    const store = transaction.objectStore("TCNTHistoryReceive");
    const request = store.getAll();

    request.onsuccess = () => {
      if (request.result) {
        const mappedData: History[] = request.result.map((item: History) => ({
          FTDate: item.FTDate,
          FTRefDoc: item.FTRefDoc,
          FNStatus: item.FNStatus,
        }));

        console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData); // ✅ ตรวจสอบข้อมูลที่ดึงมา
        setHistoryList(mappedData);
      }
    };

    request.onerror = () => {
      console.error("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };

  const saveToIndexedDB = async (storeName: string, data: (History | Product)[]) => {
    try {

      if (!oDb) {
        console.error("❌ Database is not initialized");
        return;
      }
      const transaction = oDb.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      data.forEach((item) => {
        const addRequest = store.add(item);
        addRequest.onerror = () => console.error(`❌ บันทึกไม่สำเร็จ`, addRequest.error);
      });

      transaction.oncomplete = () => {
        console.log(`✅ บันทึกข้อมูลสำเร็จใน '${storeName}'`);
        setRefDoc("");
      };

      transaction.onerror = () => {
        console.error("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล", transaction.error || "Unknown Error");
      };
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการใช้งาน IndexedDB", error);
    }
  };

  // 📌 ฟังก์ชันบันทึกประวัติ
  const saveHistoryToIndexedDB = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }
    const currentDate = new Date().toLocaleDateString("th-TH");

    const historyData: History = {
      FTDate: currentDate,
      FTRefDoc: refDoc,
      FNStatus: 1,
    };

    await saveToIndexedDB("TCNTHistoryReceive", [historyData]);
  };

  // 📌 ฟังก์ชันบันทึกสินค้า
  const saveProductToIndexedDB = async () => {

    const productData = products.map((product) => ({
      FNId: product.FNId,
      FTBarcode: product.FTBarcode,
      FCCost: product.FCCost,
      FNQuantity: product.FNQuantity,
      FTRefDoc: product.FTRefDoc,
    }));

    await saveToIndexedDB("TCNTProductReceive", productData);
    setProducts([]);
  };

  {/* เช็ค User*/ }
  useAuth();

  {/* ใช้ useEffect ในการเก็บค่า checked และ cost ไว้ */ }
  useEffect(() => {
    checkedRef.current = checked;
    costRef.current = cost;
  }, [checked, cost]);

  {/* ใช้ useEffect ในการเก็บค่า cost ไว้ */ }
  useEffect(() => {
    if (pendingBarcode !== null) {
      addProduct(pendingBarcode, cost); // ✅ รอจน `cost` เปลี่ยนก่อนค่อยทำงาน
      setPendingBarcode(null);
    }
  }, [cost]);

  {/* สแกน BarCode */ }
  const { C_PRCxStartScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef } = CCameraScanner(
    (ptDecodedText) => {
      C_PRCxPauseScanner();
      if (checkedRef.current) {
        const bConfirmed = window.confirm(`เพิ่มข้อมูล: ${ptDecodedText} ?`);
        if (bConfirmed) {
          setBarcode(ptDecodedText);
          addProduct(ptDecodedText, costRef.current);
        }
      } else {
        setBarcode(ptDecodedText);
        alert(`ข้อความ: ${ptDecodedText}`);
      }
      // ✅ รอ 500ms ก่อนเปิดกล้องใหม่
      setTimeout(() => {
        C_PRCxResumeScanner();
      }, 500);
    }
  );

  {/* เพิ่มสินค้า */ }
  const addProduct = (barcode: string, cost: string) => {
    if (!cost) {
      setCost("0");
      setPendingBarcode(barcode);
      return;
    }

    if (!barcode || !quantity || !refDoc){
      alert("❌ กรุณากรอกข้อมูลให้ครบ");
      return;
    } 

    setProducts((prevProducts) => {
      const newId = Math.max(...prevProducts.map(p => p.FNId), 0) + 1;

      const newProduct = {
        FNId: newId,
        FTBarcode: barcode,
        FCCost: parseFloat(cost),
        FNQuantity: parseInt(quantity),
        FTRefDoc: refDoc
      };

      return [...prevProducts, newProduct];
    });

    setBarcode("");
    setCost("");
    setQuantity("1");
  };

  {/* ลบสินค้า */ }
  const removeProduct = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .filter((product) => product.FNId !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );
  };

  {/* export excel */ }
  const exportProduct = () => {
    const formattedProducts = products.map(product => ({
      tBarcode: product.FTBarcode,
      tCost: product.FCCost.toString(),
      tQTY: product.FNQuantity.toString()
    }));
    exportToExcel(formattedProducts);
  };

  // ปิด dropdown
  const handleClickOutside = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleView = (history: History) => {
    alert(`ดูข้อมูลของ Receive: ${history.FTRefDoc}`);
  };

  const handleRepeat = (history: History) => {
    alert(`ทำซ้ำใบอ้างอิง Receive: ${history.FTRefDoc}`);
  };

  async function C_PRCxSaveDB() {
    if (!isNetworkOnline){
      alert("❌ ข้อความ: Internet Offline");
      return;
    }
    if (!products || products.length === 0) {
      alert("❌ ข้อความ: ไม่มีข้อมูลสินค้า");
      return;
    }
    setIsLoading(true); // ✅ เริ่ม Loading
    try {
      console.log("✅ ข้อมูล History ถูกบันทึก");
      await saveHistoryToIndexedDB();

      console.log("✅ ข้อมูล Product ถูกบันทึก");
      await saveProductToIndexedDB();

      console.log("✅ เข้าลบข้อมูล History, Data ที่เกิน limit");
      if (!oDb) {
        console.error("❌ Database is not initialized");
        return;
      }
      await C_DELxLimitData(oDb, limitData, "TCNTHistoryReceive", "TCNTProductReceive");

      console.log("✅ โหลดข้อมูล List ใหม่");
      await C_PRCxFetchHistoryList();
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดใน C_PRCxSaveDB", error);
    } finally {
      setIsLoading(false); // ✅ จบ Loading
      alert("✅ บันทึกข้อมูลสำเร็จ");
    }
  }

  return (
    <div className="p-4 ms-1 mx-auto bg-white" onClick={handleClickOutside}>
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
              onClick={C_PRCxSaveDB}
            >
              <FaFileAlt className="mr-2 text-gray-700" /> อัพโหลดผ่าน Web Services
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={exportProduct}
            >
              <FaDownload className="mr-2 text-gray-700" /> ส่งออกเป็น File Excel
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
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
          ref={oScannerRef}
          className={`my-4 relative flex items-center justify-center  md:w-[50%] w-[100%] mx-auto ${bScanning ? "h-[50%]" : "h-[0px] pointer-events-none"
            } transition-opacity duration-300`}
        >
        </div>

        <InputWithLabelAndButton
          type="text"
          label={"บาร์โค้ด"}
          value={barcode}
          onChange={setBarcode}
          icon={bScanning ? <FiCameraOff /> : <FiCamera />}
          placeholder="สแกนหรือป้อนบาร์โค้ด"
          onClick={C_PRCxStartScanner}
        />

        <InputWithLabel
          type="number"
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
          onClick={() => addProduct(barcode, cost)}
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
          {products.map((product, index) => (
            <tr key={index} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{product.FTBarcode}</td>
              <td className="p-2">฿{product.FCCost.toFixed(2)}</td>
              <td className="p-2">{product.FNQuantity}</td>
              <td className="p-2">
                <button onClick={() => removeProduct(product.FNId)} className="text-red-500">
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

      {/* ประวัติการทำรายการ */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        Data={historyList}
        onView={handleView}
        onRepeat={handleRepeat} />

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

    </div>
  );
}

