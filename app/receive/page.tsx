"use client";

import InputWithButton from "@/components/InputWithButton";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { CCameraScanner } from "@/hooks/CCameraScanner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory } from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import exportToExcel from '@/hooks/CTransfersToExcel';

import { History, Product, UserInfo } from "@/models/models"
import { C_PRCxOpenIndexedDB, C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB } from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import HistoryReceiveModal from "@/components/HistoryReceiveModal";
import ProductReceiveModal from "@/components/ProductReceiveModal";


export default function Receive() {
  const [tRefDoc, setRefDoc] = useState("");
  const [oProducts, setProducts] = useState<Product[]>([]);
  const [tBarcode, setBarcode] = useState("");
  const [tCost, setCost] = useState("");
  const [tQty, setQuantity] = useState("1");
  const [bDropdownOpen, setIsOpen] = useState(false);
  const [bCheckAutoScan, setChecked] = useState(false);
  const [tSearchPoText, setSearchText] = useState<string>(""); // string
  const [oPendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [historyList, setHistoryList] = useState<History[]>([]);
  const [productHistoryList, setProductHistoryList] = useState<Product[]>();
  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);
  const [oDb, setDB] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const limitData = 3;
  const isNetworkOnline = useNetworkStatus();
  const checkedRef = useRef(bCheckAutoScan);
  const costRef = useRef(tCost);
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tRefSeq, setRefSeq] = useState("");

  const [tHistoryDate, setHistoryDate] = useState("");
  const [tHistoryRefDoc, setHistoryRefDoc] = useState("");

  {/* เช็ค User*/ }
  useAuth();
  {/* เปิด IndexedDB */ }
  useEffect(() => {
    const initDB = async () => {
      const database = await C_PRCxOpenIndexedDB();
      setDB(database);

      // ✅ ดึงข้อมูลผู้ใช้หลังจาก oDb ถูกตั้งค่า
      const data = await C_GETxUserData(database);
      if (data) {
        setUserInfo(data);
        console.log("✅ ข้อมูลผู้ใช้ถูกตั้งค่า:", data);
      }

      setRefSeq(crypto.randomUUID());
    };

    initDB();
  }, []);
  {/* set HistoryList เมื่อ oDb ถูกเซ็ต  */ }
  useEffect(() => {
    if (oDb) {
      C_PRCxFetchHistoryList();
      C_PRCxFetchProductHistoryList();
    }
  }, [oDb]);
  {/* ใช้ useEffect ในการเก็บค่า checked และ cost  */ }
  useEffect(() => {
    checkedRef.current = bCheckAutoScan;
    costRef.current = tCost;
  }, [bCheckAutoScan, tCost]);
  useEffect(() => {
    if (oPendingBarcode !== null) {
      C_ADDxProduct(oPendingBarcode, tCost); // ✅ รอจน `cost` เปลี่ยนก่อนค่อยทำงาน
      setPendingBarcode(null);
    }
  }, [tCost]);

  {/* สแกน BarCode */ }
  const { C_PRCxStartScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef } = CCameraScanner(
    (ptDecodedText) => {
      C_PRCxPauseScanner();
      if (checkedRef.current) {
        const bConfirmed = window.confirm(`เพิ่มข้อมูล: ${ptDecodedText} ?`);
        if (bConfirmed) {
          setBarcode(ptDecodedText);
          C_ADDxProduct(ptDecodedText, costRef.current);
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

  {/* ดึงข้อมูล History จาก IndexedDB */ }
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
          FTRefSeq: item.FTRefSeq
        }));

        console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData); // ✅ ตรวจสอบข้อมูลที่ดึงมา
        setHistoryList(mappedData);
      }
    };

    request.onerror = () => {
      console.error("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };

  const C_PRCxFetchProductHistoryList = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }

    const transaction = oDb.transaction("TCNTProductReceive", "readonly");
    const store = transaction.objectStore("TCNTProductReceive");
    const request = store.getAll();

    request.onsuccess = () => {
      if (request.result) {
        const mappedData: Product[] = request.result.map((item: Product) => ({
          FNId: item.FNId,
          FTBarcode: item.FTBarcode,
          FCCost: item.FCCost,
          FNQuantity: item.FNQuantity,
          FTRefDoc: item.FTRefDoc,
          FTRefSeq: item.FTRefSeq
        }));

        console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData);
        setProductHistoryList(mappedData);
      }
    };

    request.onerror = () => {
      console.error("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };

  const C_INSxHistoryToIndexedDB = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }
    const currentDate = new Date().toLocaleDateString("th-TH");

    const historyData: History = {
      FTDate: currentDate,
      FTRefDoc: tRefDoc,
      FNStatus: 1,
      FTRefSeq: tRefSeq
    };

    await C_INSxDataIndexedDB(oDb, "TCNTHistoryReceive", [historyData]);
  };
  const C_INSxProductToIndexedDB = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }

    const productData = oProducts.map((oProducts) => ({
      FNId: oProducts.FNId,
      FTBarcode: oProducts.FTBarcode,
      FCCost: oProducts.FCCost,
      FNQuantity: oProducts.FNQuantity,
      FTRefDoc: oProducts.FTRefDoc,
      FTRefSeq: oProducts.FTRefSeq
    }));

    await C_INSxDataIndexedDB(oDb, "TCNTProductReceive", productData);
    setProducts([]);
  };

  {/* เพิ่มสินค้า */ }
  const C_ADDxProduct = (ptBarcode: string, ptCost: string) => {
    if (!ptCost) {
      setCost("0");
      setPendingBarcode(ptBarcode);
      return;
    }

    if (!ptBarcode || !tQty ) {
      alert("❌ กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setProducts((prevProducts) => {
      const newId = Math.max(...prevProducts.map(p => p.FNId), 0) + 1;

      const newProduct = {
        FNId: newId,
        FTBarcode: ptBarcode,
        FCCost: parseFloat(tCost),
        FNQuantity: parseInt(tQty),
        FTRefDoc: tRefDoc,
        FTRefSeq: tRefSeq
      };

      return [...prevProducts, newProduct];
    });

    setBarcode("");
    setCost("");
    setQuantity("1");
  };
  {/* ลบสินค้า */ }
  const C_DELxProduct = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .filter((product) => product.FNId !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );
  };


  {/* export excel */ }
  const exportProduct = () => {
    const formattedProducts = oProducts.map(oProducts => ({
      tBarcode: oProducts.FTBarcode,
      tCost: oProducts.FCCost.toString(),
      tQTY: oProducts.FNQuantity.toString()
    }));
    exportToExcel(formattedProducts);
  };

  {/* ปิด Dropdown เมื่อคลิกข้างนอก */ }
  const C_SETxCloseDropdown = () => {
    if (bDropdownOpen) {
      setIsOpen(false);
    }
  };
  const C_SETxViewHistoryProduct = (history: History) => {
    const oFiltered = productHistoryList?.filter((product) => product.FTRefDoc === history.FTRefDoc);
    setHistoryDate(history.FTDate);
    setHistoryRefDoc(history.FTRefDoc);
    setFilteredProduct(oFiltered || []);
    setIsProductOpen(true);
  };
  const handleRepeat = (history: History) => {
    alert(`ทำซ้ำใบอ้างอิง Receive: ${history.FTRefDoc}`);
  };

  {/* Upload */ }
  async function C_PRCxSaveDB() {
    if (!isNetworkOnline) {
      alert("❌ ข้อความ: Internet Offline");
      return;
    }
    if (!oProducts || oProducts.length === 0) {
      alert("❌ ข้อความ: ไม่มีข้อมูลสินค้า");
      return;
    }
    setIsLoading(true); // ✅ เริ่ม Loading
    try {
      console.log("✅ หา RefSeq ใหม่");
      const newRefSeq = crypto.randomUUID();
      setRefSeq(newRefSeq);
      console.log("✅ RefSeq = ",newRefSeq);

      console.log("✅ ข้อมูล History ถูกบันทึก");
      await C_INSxHistoryToIndexedDB();

      console.log("✅ ข้อมูล Product ถูกบันทึก");
      await C_INSxProductToIndexedDB();

      console.log("✅ เข้าลบข้อมูล History, Data ที่เกิน limit");
      if (!oDb) {
        console.error("❌ Database is not initialized");
        return;
      }
      await C_DELxLimitData(oDb, limitData, "TCNTHistoryReceive", "TCNTProductReceive");

      console.log("✅ โหลดข้อมูล List ใหม่");
      await C_PRCxFetchHistoryList();
      await C_PRCxFetchProductHistoryList();
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดใน C_PRCxSaveDB", error);
    } finally {
      setRefDoc("");
      setIsLoading(false); // ✅ จบ Loading
      alert("✅ บันทึกข้อมูลสำเร็จ");
    }
  }


  return (
    <div className="p-4 ms-1 mx-auto bg-white" onClick={C_SETxCloseDropdown}>
      <div className="flex flex-col md:flex-row items-start md:items-center pb-6">
        <div className="flex flex-row w-full py-2">
          {/* หัวข้อ */}
          <h1 className="text-2xl font-bold md:pb-0">รับสินค้าจากผู้จำหน่าย</h1>
          {/* ปุ่ม 3 จุด จอเล็ก */}
          <button
            className="md:hidden ml-2 p-2 rounded-md ml-auto text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!bDropdownOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>
        {/* ค้นหา PO และปุ่ม 3 จุด (สำหรับ desktop) */}
        <div className="flex w-full md:w-80 md:ml-auto pt-2 relative">
          <InputWithButton
            type="text"
            value={tSearchPoText}
            onChange={setSearchText}
            placeholder="ค้นหาใบ PO"
            icon={<GrDocumentText />}
            onClick={() => alert(`ข้อความ: ${tSearchPoText}`)}
          />
          {/* ปุ่ม 3 จุด */}
          <button
            className="hidden md:block ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!bDropdownOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>
        {/* Dropdown Menu */}
        {bDropdownOpen && (
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
          value={tRefDoc}
          onChange={setRefDoc}
          placeholder="ระบุเลขที่อ้างอิงจาก Supplier"
        />

        {/* ตัวสแกน QR Code พร้อมกรอบ */}
        <div
          id="reader"
          ref={oUserInfo?.FTUsrName ? oScannerRef : null}
          className={`my-4 relative flex items-center justify-center  md:w-[50%] w-[100%] mx-auto ${bScanning ? "h-[50%]" : "h-[0px] pointer-events-none"
            } transition-opacity duration-300`}
        >
        </div>

        <InputWithLabelAndButton
          type="text"
          label={"บาร์โค้ด"}
          value={tBarcode}
          onChange={setBarcode}
          icon={bScanning ? <FiCameraOff /> : <FiCamera />}
          placeholder="สแกนหรือป้อนบาร์โค้ด"
          onClick={C_PRCxStartScanner}
        />

        <InputWithLabel
          type="number"
          label={"ต้นทุน"}
          value={tCost}
          onChange={setCost}
          placeholder="ระบุต้นทุน (ถ้ามี)"
        />

        <InputWithLabelAndButton
          type="number"
          value={tQty}
          onChange={setQuantity}
          label={"จำนวนที่ได้รับ"}
          icon={<FaPlus />}
          onClick={() => C_ADDxProduct(tBarcode, tCost)}
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
          {oProducts.map((oProducts, index) => (
            <tr key={index} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{oProducts.FTBarcode}</td>
              <td className="p-2">฿{oProducts.FCCost.toFixed(2)}</td>
              <td className="p-2">{oProducts.FNQuantity}</td>
              <td className="p-2">
                <button onClick={() => C_DELxProduct(oProducts.FNId)} className="text-red-500">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col md:flex-row items-start md:items-center mt-4 ">

        {/* จำนวนรายการ */}
        <p className="text-gray-500 text-[14px]">จำนวนรายการ: {oProducts.length} รายการ</p>

        <div className="flex w-full md:w-auto md:ml-auto pt-2 relative">
          <label className="flex items-center text-gray-500 text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={bCheckAutoScan}
              onChange={() => setChecked(!bCheckAutoScan)}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2">บันทึกอัตโนมัติหลังสแกนบาร์โค้ด</span>
          </label>
        </div>
      </div>

      {/* ประวัติการทำรายการ */}
      <HistoryReceiveModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        oDataHistory={historyList}
        onView={C_SETxViewHistoryProduct}
        onRepeat={handleRepeat} />

      {/* ข้อมูลประวัติสินค้า */}
      <ProductReceiveModal
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        oDataProduct={oFilteredProduct || []}
        tDate={tHistoryDate}
        tRefDoc={tHistoryRefDoc}
      />

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

    </div>
  );
}

