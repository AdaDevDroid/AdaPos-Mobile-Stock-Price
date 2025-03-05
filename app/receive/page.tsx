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

interface Product {
  id: number;
  barcode: string;
  cost: number;
  quantity: number;
  refDoc: string;
}

interface History {
  id: number;
  date: string;
  refDoc: string;
  status: number;
}

const mockHistoryData: History[] = [
  {
    id: 1,
    date: "2025-03-01",
    refDoc: "PO123456",
    status: 1
  },
  {
    id: 2,
    date: "2025-03-02",
    refDoc: "PO123457",
    status: 0
  },
  {
    id: 3,
    date: "2025-03-03",
    refDoc: "PO123458",
    status: 1
  },
];

export default function ReceiveGoods() {
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
  const [historyList, setHistoryList] = useState<History[]>(mockHistoryData);

  const DB_NAME = "AdaDB";
  const DB_VERSION = 4; // อัปเดตเวอร์ชันหากมีการเปลี่ยนแปลงโครงสร้าง

  // 📌 ฟังก์ชันเปิดฐานข้อมูล (เปิดเพียงครั้งเดียว)
  const openDatabase = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // ✅ ตรวจสอบและสร้าง object stores
        if (!db.objectStoreNames.contains("reciveHistory")) {
          db.createObjectStore("reciveHistory", { autoIncrement: true });
          console.log("✅ สร้างตาราง 'reciveHistory'");
        }
        if (!db.objectStoreNames.contains("reciveProduct")) {
          db.createObjectStore("reciveProduct", { autoIncrement: true });
          console.log("✅ สร้างตาราง 'reciveProduct'");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const saveToIndexedDB = async (storeName: string, data: any[]) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      data.forEach((item) => {
        const addRequest = store.add(item);
        addRequest.onerror = () => console.error(`❌ บันทึกไม่สำเร็จ`, addRequest.error);
      });

      transaction.oncomplete = () => {
        alert(`✅ ข้อความ: บันทึกข้อมูลสำเร็จ`);
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
  const { C_PRCxStartScanner, bScanning, oScannerRef } = CCameraScanner(
    (ptDecodedText) => {
      if (checkedRef.current) {
        setBarcode(ptDecodedText);
        alert(`เพิ่มข้อมูล: ${ptDecodedText}`);
        addProduct(ptDecodedText, costRef.current);
      } else {
        setBarcode(ptDecodedText);
        alert(`ข้อความ: ${ptDecodedText}`);
      }
    }
  );

  {/* เพิ่มสินค้า */ }
  const addProduct = (barcode: string, cost: string) => {
    if (!cost) {
      setCost("0");
      setPendingBarcode(barcode);
      return;
    }

    if (!barcode || !quantity) return;

    setProducts((prevProducts) => {
      const newId = Math.max(...prevProducts.map(p => p.id), 0) + 1;

      const newProduct = {
        id: newId,
        barcode,
        cost: parseFloat(cost),
        quantity: parseInt(quantity),
        refDoc
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
        .filter((product) => product.id !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );
  };

  // ปิด dropdown
  const handleClickOutside = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleView = (history: History) => {
    alert(`ดูข้อมูลของ Receive: ${history.refDoc}`);
  };

  const handleRepeat = (history: History) => {
    alert(`ทำซ้ำใบอ้างอิง Receive: ${history.refDoc}`);
  };

  function C_PRCxSaveDB() {
    if (!products || products.length === 0) {
      alert("❌ ข้อความ: ไม่มีข้อมูลสินค้า");
      return;
    }
    saveHistoryToIndexedDB();
    saveProductToIndexedDB();
  }

  const saveHistoryToIndexedDB = async () => {
    const db = await openDatabase();
    if (!db) return;
  
    const currentDate = new Date().toLocaleDateString("th-TH");
    const lastId = await getLastIdFromIndexedDB(db, "reciveHistory");
    const newId = lastId + 1; // ถ้าไม่มีข้อมูล ให้เริ่มจาก 1
  
    const historyData: History = {
      id: newId,
      date: currentDate,
      refDoc: refDoc,
      status: 1,
    };
  
    await saveToIndexedDB("reciveHistory", [historyData]);
  };

  // 📌 ฟังก์ชันบันทึกสินค้า
  const saveProductToIndexedDB = async () => {
    alert("✅ ข้อความ: อัพโหลดผ่าน Web Services");

    const productData = products.map((product) => ({
      id: product.id,
      barcode: product.barcode,
      cost: product.cost,
      quantity: product.quantity,
      refdoc: product.refDoc,
    }));

    await saveToIndexedDB("reciveProduct", productData);
    setProducts([]);
  };

  const getLastIdFromIndexedDB = async (db: IDBDatabase, storeName: string): Promise<number> => {
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.openCursor(null, "prev"); // เปิด cursor ดูค่า id ล่าสุด
  
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          resolve(cursor.value.id); // คืนค่า id ล่าสุด
        } else {
          resolve(0); // ถ้าไม่มีข้อมูลเลย ให้ return 0
        }
      };
  
      request.onerror = () => {
        console.error("❌ ไม่สามารถดึง id ล่าสุดจาก IndexedDB ได้");
        resolve(0);
      };
    });
  };

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
              onClick={() => alert(`ข้อความ: ส่งออกเป็น File Excel`)}
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

      {/* ประวัติการทำรายการ */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onView={handleView}
        onRepeat={handleRepeat} />

    </div>
  );
}

