"use client";

import InputWithButton from "@/components/InputWithButton";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { CCameraScanner } from "@/hooks/CCameraScanner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory, FaRegSave } from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import exportToExcel from '@/hooks/CTransferreceiptoutToExcel';
import { History, Product, UserInfo } from "@/models/models"
import { C_PRCxOpenIndexedDB, C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB, C_GETxConfig,C_DELoDataTmp,C_DELxProductTmpByFNId } from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import HistoryModal from "@/components/HistoryModal";
import ProductReceiveModal from "@/components/ProductReceiveModal";
import { C_INSxProducts, C_SETxFormattedDate } from "@/hooks/CSP";
import RepeatModal from "@/components/RepeatModal";


export default function Receive() {
  const [tRefDoc, setRefDoc] = useState("");
  const [oProducts, setProducts] = useState<Product[]>([]);
  const [tBarcode, setBarcode] = useState("");
  const [tCost, setCost] = useState("");
  const [tQty, setQty] = useState("1");
  const [tSearchPoText, setSearchText] = useState<string>(""); // string
  const [oPendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [oHistoryList, setHistoryList] = useState<History[]>([]);
  const [oProductHistoryList, setProductHistoryList] = useState<Product[]>();
  const [oDb, setDB] = useState<IDBDatabase | null>(null);
  const tCostRef = useRef(tCost);
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tRefSeq, setRefSeq] = useState("");
  const [tHistoryDate, setHistoryDate] = useState("");
  const [tHistoryRefDoc, setHistoryRefDoc] = useState("");
  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);

  const isNetworkOnline = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScanAuto, setIsLoadingScanAuto] = useState(false);
  const [bCheckAutoScan, setChecked] = useState(false);
  const bCheckedRef = useRef(bCheckAutoScan);
  const [bDropdownOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);

  const [nFixPntShow, setFixPntShow] = useState(4);

  {/* เช็ค User */ }
  useAuth();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  {/* Set init IndexedDB */ }
  useEffect(() => { 
    const initDB = async () => {

      try {
        const database = await C_PRCxOpenIndexedDB();
        setDB(database);

        // ดึงข้อมูลผู้ใช้หลังจาก oDb ถูกตั้งค่า
        const data = await C_GETxUserData(database);
        if (data) {
          setUserInfo(data);
          console.log("✅ ข้อมูลผู้ใช้ถูกตั้งค่า");
        }

        const config = await C_GETxConfig(database);

        if (config) {
          // 🔍 ค้นหา FTSysCode ที่ตรงกับ "ADecPntShw"
          const foundConfig = config.find((item) => item.FTSysCode === "ADecPntShw");

          if (foundConfig) {
            // แปลงค่าจาก string → int
            const fixPntShow = parseInt(foundConfig.FTSysStaUsrValue, 10);

            if (!isNaN(fixPntShow)) {
              setFixPntShow(fixPntShow);
            } else {
              console.warn("⚠️ ค่า FTSysStaUsrValue ไม่ใช่ตัวเลข:", foundConfig.FTSysStaUsrValue);
            }
          } else {
            console.warn("⚠️ ไม่พบค่า FTSysCode = 'ADecPntShw'");
          }
        } else {
          console.warn("⚠️ ไม่มีข้อมูลจาก IndexedDB");
        }

        setRefSeq(crypto.randomUUID());
      } catch (error) {
        console.log("❌ เกิดข้อผิดพลาดในการเปิด IndexedDB", error);
      } finally {
      }
    };

    initDB();
  }, []);
  {/* FetchData เมื่อ oDb ถูกเซ็ต  */ }
  useEffect(() => {
    if (oDb) {
      C_PRCxFetchHistoryList();
      C_PRCxFetchProductHistoryList();
      C_PRCxFetchProductTmpList();
    }
  }, [oDb]);
  {/* ใช้ useEffect ในการเก็บค่า checked และ cost  */ }
  useEffect(() => {
    bCheckedRef.current = bCheckAutoScan;
    tCostRef.current = tCost;
  }, [bCheckAutoScan, tCost]);
  useEffect(() => {
    if (oPendingBarcode !== null) {
      C_ADDxProduct(oPendingBarcode, tCost); // ✅ รอจน `cost` เปลี่ยนก่อนค่อยทำงาน
      setPendingBarcode(null);
    }
  }, [tCost]);




  {/* สแกน BarCode */ }
  const { C_PRCxStartScanner, C_PRCxStopScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef } = CCameraScanner(
    (ptDecodedText) => {
      C_PRCxScan(ptDecodedText)
    }
  );

  const C_PRCxScan = (ptDecodedText: string) => {
    C_PRCxPauseScanner();
    setBarcode(ptDecodedText);
  
    if (bCheckedRef.current) {
      setIsLoadingScanAuto(true);
      let countdown = 1;
  
      const timer = setInterval(() => {
        console.log(`⏳ กำลังเพิ่มข้อมูลใน ${countdown} วินาที...`);
        countdown--;
  
        if (countdown === 0) {
          clearInterval(timer);
          C_ADDxProduct(ptDecodedText, tCostRef.current);
          setIsLoadingScanAuto(false);
        }
      }, 1000);
  
      // Resume Scanner หลังจาก countdown วินาที
      setTimeout(() => {
        C_PRCxResumeScanner();
      }, countdown * 1000);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        C_PRCxResumeScanner();
        setIsLoading(false);
      }, 500);
      
    }
  };
  
  const C_PRCxFetchHistoryList = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
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
      console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };
  const C_PRCxFetchProductHistoryList = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
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
          FTRefSeq: item.FTRefSeq,
          FTXthDocKey: item.FTXthDocKey,
          FTBchCode: item.FTBchCode,
          FTAgnCode: item.FTAgnCode,
          FTUsrName: item.FTUsrName,
          FDCreateOn: item.FDCreateOn
        }));

        console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData);
        setProductHistoryList(mappedData);
      }
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };
  const C_INSxHistoryToIndexedDB = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    const currentDate = new Date().toLocaleDateString("th-TH");

    const historyData: History = {
      FTDate: currentDate,
      FTRefDoc: tRefDoc,
      FNStatus: isNetworkOnline ? 1 : 1,
      FTRefSeq: tRefSeq
    };

    await C_INSxDataIndexedDB(oDb, "TCNTHistoryReceive", [historyData]);
  };
  const C_INSxProductToIndexedDB = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    console.log("Products ก่อน insert ลง DB", oProducts)
    const productData = oProducts.map((oProducts) => ({
      FNId: oProducts.FNId,
      FTBarcode: oProducts.FTBarcode,
      FCCost: oProducts.FCCost,
      FNQuantity: oProducts.FNQuantity,
      FTRefDoc: oProducts.FTRefDoc,
      FTRefSeq: tRefSeq,
      FTXthDocKey: "TCNTPdtTwiHD",
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FDCreateOn: C_SETxFormattedDate()
    }));
    console.log("Products ก่อน insert ลง DB 2", productData)
    await C_INSxDataIndexedDB(oDb, "TCNTProductReceive", productData);
    setProducts([]);
  };
{/* Save ขอมูล Tmp */ }
  const C_INSxProductTmpToIndexedDB = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    await C_DELoDataTmp(oDb,"TCNTProductReceiveTmp");
    console.log("Products ก่อน insert ลง DB", oProducts)
    const productData = oProducts.map((oProducts) => ({
      FNId: oProducts.FNId,
      FTBarcode: oProducts.FTBarcode,
      FCCost: oProducts.FCCost,
      FNQuantity: oProducts.FNQuantity,
      FTRefDoc: oProducts.FTRefDoc,
      FTRefSeq: tRefSeq,
      FTXthDocKey: "TCNTPdtTwiHD",
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FDCreateOn: C_SETxFormattedDate()
    }));
    console.log("Products ก่อน insert ลง DB 2", productData)
    await C_INSxDataIndexedDB(oDb, "TCNTProductReceiveTmp", productData);
    alert("✅ บันทึกข้อมูลสำเร็จ");
  };

{/* Select ขอมูล Tmp */ }
  const C_PRCxFetchProductTmpList = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }

    const transaction = oDb.transaction("TCNTProductReceiveTmp", "readonly");
    const store = transaction.objectStore("TCNTProductReceiveTmp");
    const request = store.getAll();

    request.onsuccess = () => {
      if (request.result) {
        const mappedData: Product[] = request.result.map((item: Product) => ({
          FNId: item.FNId,
          FTBarcode: item.FTBarcode,
          FCCost: item.FCCost,
          FNQuantity: item.FNQuantity,
          FTRefDoc: item.FTRefDoc,
          FTRefSeq: item.FTRefSeq,
          FTXthDocKey: item.FTXthDocKey,
          FTBchCode: item.FTBchCode,
          FTAgnCode: item.FTAgnCode,
          FTUsrName: item.FTUsrName,
          FDCreateOn: item.FDCreateOn,
        }));

        console.log("🔹 ข้อมูลที่ได้จาก TCNTProductReceiveTmp:", mappedData);
        if(mappedData.length > 0){
          setProducts(mappedData);
          setRefDoc(mappedData[0].FTRefDoc);
        }
      }
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงข้อมูลจาก TCNTProductReceiveTmp ได้");
    };
  };


  {/* เพิ่มสินค้า */ }
  const C_ADDxProduct = (ptBarcode: string, ptCost: string) => {
    if (!ptCost) {
      setCost("0");
      setPendingBarcode(ptBarcode);
      return;
    }

    if (!ptBarcode || !tQty) {
      alert("กรุณากรอกบาร์โค้ด หรือจำนวนให้ครบถ้วน");
      return;
    }

    setProducts((prevProducts) => {
      const newId = Math.max(...prevProducts.map(p => p.FNId), 0) + 1;

      const newProduct = {
        FNId: newId,
        FTBarcode: ptBarcode,
        FCCost: parseFloat(ptCost),
        FNQuantity: parseInt(tQty),
        FTRefDoc: tRefDoc,
        FTRefSeq: tRefSeq,
        FTXthDocKey: "TCNTPdtTwiHD",
        FTBchCode: oUserInfo?.FTBchCode || "",
        FTAgnCode: oUserInfo?.FTAgnCode || "",
        FTUsrName: oUserInfo?.FTUsrName || "",
        FDCreateOn: C_SETxFormattedDate()
      };

      return [...prevProducts, newProduct];
    });

    setBarcode("");
    setCost("");
    setQty("1");
  };
  {/* ลบสินค้า */ }
  const C_DELxProduct = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .filter((product) => product.FNId !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );


    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    C_DELxProductTmpByFNId(oDb,id,"TCNTProductReceiveTmp");
  };
  {/* export excel */ }
  const exportProduct = () => {
    const formattedProducts = oProducts.map(oProducts => ({
      tBarcode: oProducts.FTBarcode,
      tQTY: oProducts.FNQuantity.toString(),
      tCost: oProducts.FCCost.toString()
    }));
    exportToExcel(formattedProducts);
  };
  {/* ปิด Dropdown เมื่อคลิกข้างนอก */ }
  const C_SETxCloseDropdown = () => {
    if (bDropdownOpen) {
      setIsOpen(false);
    }
  };
  async function C_PRCxSaveDB() {
    try {
      console.log("✅ หา RefSeq ใหม่");
      const newRefSeq = crypto.randomUUID();
      setRefSeq(newRefSeq);
      console.log("✅ RefSeq = ", newRefSeq);

      console.log("✅ ข้อมูล History ถูกบันทึก");
      await C_INSxHistoryToIndexedDB();

      console.log("✅ ข้อมูล Product ถูกบันทึก");
      await C_INSxProductToIndexedDB();


  
      console.log("✅ เข้าลบข้อมูล History, Data ที่เกิน limit");
      if (!oDb) {
        console.log("❌ Database is not initialized");
        return;
      }
      await C_DELxLimitData(oDb, "TCNTHistoryReceive", "TCNTProductReceive");

      console.log("✅ ลบข้อมูล Product Tmp");
      await C_DELoDataTmp(oDb,"TCNTProductReceiveTmp");

      console.log("✅ โหลดข้อมูล List ใหม่");
      await C_PRCxFetchHistoryList();
      await C_PRCxFetchProductHistoryList();
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดใน C_PRCxSaveDB", error);
    } finally {
      setRefDoc("");
      alert("✅ บันทึกข้อมูลสำเร็จ");
    }
  };
  async function C_PRCxUploadeWebServices() {
    setIsLoading(true);
    if (!oProducts || oProducts.length === 0) {
      setIsLoading(false);
      alert("❌ ข้อความ: ไม่มีข้อมูลสินค้า");
      return;
    }
    if (!isNetworkOnline) {
      setIsLoading(false);
      alert("❌ ข้อความ: Internet Offline ระบบยังไม่ Upload ขึ้น");
    }
    console.log("Products ก่อนอัพโหลด", oProducts)
    //  Upload ผ่าน Web Services
    C_INSxProducts(oProducts);
    // Save Data to IndexedDB
    C_PRCxSaveDB();

    setIsLoading(false);
  };
  async function C_PRCxExportExcel() {
    setIsLoading(true);
    if (!oProducts || oProducts.length === 0) {
      setIsLoading(false);
      alert("❌ ข้อความ: ไม่มีข้อมูลสินค้า");
      return;
    }

    // ส่งออกเป็น Excel
    exportProduct();
    // Save Data to IndexedDB
    C_PRCxSaveDB();
    
    
    setIsLoading(false);
  };





  async function C_PRCxSaveTmp() {
    setIsLoading(true);
    if (!oProducts || oProducts.length === 0) {
      setIsLoading(false);
      alert("❌ ข้อความ: ไม่มีข้อมูลสินค้า");
      return;
    }
    // Save Tmp Data to IndexedDB
    C_INSxProductTmpToIndexedDB();
    setIsLoading(false);
  };


  const C_SETxViewHistoryProduct = (history: History) => {
    const oFiltered = oProductHistoryList?.filter((product) => product.FTRefSeq === history.FTRefSeq);
    setHistoryDate(history.FTDate);
    setHistoryRefDoc(history.FTRefDoc);
    setFilteredProduct(oFiltered || []);
    setIsProductOpen(true);
  };
  const C_SETxViewRepeat = (history: History) => {
    // กรองข้อมูลสินค้าตาม FTRefSeq
    const oFiltered = oProductHistoryList?.filter((product) => product.FTRefSeq === history.FTRefSeq);

    if (!oFiltered || oFiltered.length === 0) {
      console.warn("⚠ ไม่มีข้อมูลสินค้าในรายการนี้");
      return;
    }

    // ตั้งค่า State ของ Products ก่อนทำงาน
    setProducts(oFiltered);
    setRefDoc(history.FTRefDoc);
    setIsRepeat(true);
  };
  const C_PRCxRepeatSelect = async (option: string) => {
    try {
      if (option === "webService") {
        await C_PRCxUploadeWebServices();
      } else if (option === "excel") {
        await C_PRCxExportExcel();
      }
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดการทำซ้ำ:", error);
    }

    // ปิด Modal หลังจากทำงานเสร็จ
    setIsRepeat(false);
  };
  async function C_PRCxSaveClearTmpData() {
   
    // Clear Tmp Data to IndexedDB
    if (oDb) {
      console.log("✅ ลบข้อมูล Product Tmp");
      await C_DELoDataTmp(oDb,"TCNTProductReceiveTmp");
      setProducts([]);
      setRefDoc("");
    } else {
      console.log("❌ Database is not initialized");
    }
  
  };


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
            onClick={() => alert(`ค้นหาใบ PO`)}
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
              onClick={C_PRCxUploadeWebServices}
            >
              <FaFileAlt className="mr-2 text-gray-700" /> บันทึก รอนำเข้ารายการ
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={C_PRCxExportExcel}
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
          ref={oScannerRef}
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
          onClick={bScanning ? C_PRCxStopScanner : C_PRCxStartScanner}
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
          onChange={setQty}
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
              <td className="p-2">{oProducts.FCCost.toFixed(nFixPntShow)}</td>
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

          
      <div className="flex w-full md:w-auto md:ml-auto pt-2 mb-10 relative justify-end">
        <div className=" mr-4 " >
            <button className="bg-blue-600 text-white px-6 py-2 flex items-center justify-center rounded-md"
                onClick={C_PRCxSaveClearTmpData}>
                       ล้างข้อมูล
            </button>
        </div>
        <div >
            <button className="bg-blue-600 text-white px-6 py-2 flex items-center justify-center rounded-md"
                onClick={C_PRCxSaveTmp}>
                  <FaRegSave className="mr-2" />
                        บันทึก
            </button>
        </div>
      </div> 
          
      {/* ประวัติการทำรายการ */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        oDataHistory={oHistoryList}
        onView={C_SETxViewHistoryProduct}
        onRepeat={C_SETxViewRepeat} />

      {/* ข้อมูลประวัติสินค้า */}
      <ProductReceiveModal
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        oDataProduct={oFilteredProduct || []}
        tDate={tHistoryDate}
        tRefDoc={tHistoryRefDoc}
      />

      {isLoadingScanAuto && (
        <div className="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          {/* ข้อความแจ้งเตือน */}
          <p className="mt-4 text-white text-lg">กำลังเพิ่มข้อมูล...</p>
        </div>
      )}

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

      {/* Repeat */}
      <RepeatModal
        isOpen={isRepeat}
        onClose={() => setIsRepeat(false)}
        onOptionSelect={C_PRCxRepeatSelect}
      />
    </div>
  );
}

