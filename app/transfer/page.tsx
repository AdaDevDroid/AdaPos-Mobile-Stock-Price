"use client";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { CCameraScanner } from "@/hooks/CCameraScanner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory } from "react-icons/fa";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import exportToExcel from '@/hooks/CProducttransferwahouseToExcel';
import { History, Product, UserInfo } from "@/models/models"
import { C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB, C_PRCxOpenIndexedDB, C_DELoDataTmp, C_DELxProductTmpByFNId, C_UPDxDataIndexedDB } from "@/hooks/CIndexedDB";
import { C_GETtGenerateRandomID, C_INSxProducts, C_SETxFormattedDate } from "@/hooks/CSP";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import HistoryModal from "@/components/HistoryModal";
import ProductTranferNStockModal from "@/components/ProductTransferNStockModal";
import RepeatModal from "@/components/RepeatModal";

type RefDocType = "0" | "1" | "2";

export default function Transfer() {
  const [refDoc, setRefDoc] = useState("");
  const [refDocType, setRefDocType] = useState<RefDocType>("1");
  const [isDisabledRefDoc, setIsDisabledRefDoc] = useState(false);
  const [oProducts, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isOpen, setIsOpen] = useState(false);
  const [bCheckAutoScan, setChecked] = useState(true);
  const [bCheckKeyboard, setCheckKeyboard] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const checkedRef = useRef(bCheckAutoScan);
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tRefSeq, setRefSeq] = useState("");
  const tQtyRef = useRef(quantity);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScanAuto, setIsLoadingScanAuto] = useState(false);
  const [isAddScan, setAddScan] = useState(false);
  const [oDb, setDB] = useState<IDBDatabase | null>(null);
  const isNetworkOnline = useNetworkStatus();
  const [historyList, setHistoryList] = useState<History[]>([]);
  const [oProductHistoryList, setProductHistoryList] = useState<Product[]>();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tHistoryDate, setHistoryDate] = useState("");
  const [tHistoryRefDoc, setHistoryRefDoc] = useState("");
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);
  const [isRepeat, setIsRepeat] = useState(false);
  const oBarcodeRef = useRef<HTMLInputElement>(null);
  const oQtyRef = useRef<HTMLInputElement>(null);

  const nListMerge = 1; // รวมรายการ 1 รวม , 0 ไม่รวม  

  {/* เช็ค User*/ }
  useAuth();

  useEffect(() => {
    // Focus ไปที่ input เมื่อ component โหลด
    oBarcodeRef.current?.focus();
  }, []);

  {/* เปิด IndexedDB */ }
  useEffect(() => {
    const initDB = async () => {

      try {
        const database = await C_PRCxOpenIndexedDB();
        setDB(database);

        // ✅ ดึงข้อมูลผู้ใช้หลังจาก oDb ถูกตั้งค่า
        const data = await C_GETxUserData(database);
        if (data) {
          setUserInfo(data);
          console.log("✅ ข้อมูลผู้ใช้ถูกตั้งค่า:", data);
        }

        setRefSeq(C_GETtGenerateRandomID());
      } catch (error) {
        console.log("❌ เกิดข้อผิดพลาดในการเปิด IndexedDB", error);
      }
    };
    initDB();
  }, []);
  {/* set HistoryList เมื่อ oDb ถูกเซ็ต  */ }
  useEffect(() => {
    if (oDb) {
      C_PRCxFetchHistoryList();
      C_PRCxFetchProductHistoryList();
      C_PRCxFetchProductTmpList();
    }
  }, [oDb]);
  {/* ใช้ useEffect ในการเก็บค่า checked ไว้ */ }
  useEffect(() => {
    checkedRef.current = bCheckAutoScan;
    tQtyRef.current = quantity;
  }, [bCheckAutoScan, quantity]);

  {/* สแกน BarCode */ }
  const { C_PRCxStartScanner, C_PRCxStopScanner, C_PRCxPauseScanner, C_PRCxResumeScanner, bScanning, oScannerRef } = CCameraScanner(
    (ptDecodedText) => {
      C_PRCxScan(ptDecodedText)
    }
  );

  const C_PRCxScan = (ptDecodedText: string) => {
    C_PRCxPauseScanner();
    setBarcode(ptDecodedText);

    if (checkedRef.current) {
      setIsLoadingScanAuto(true);
      let countdown = 1;

      const timer = setInterval(() => {
        console.log(`⏳ กำลังเพิ่มข้อมูลใน ${countdown} วินาที...`);
        countdown--;

        if (countdown === 0) {
          clearInterval(timer);
          C_ADDxProduct(ptDecodedText, tQtyRef.current);
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
      oQtyRef.current?.focus();
    }
  };

  const C_PRCxScanBar = (ptDecodedText: string) => {
    setBarcode(ptDecodedText);
    setAddScan(true);
    C_ADDxProduct(ptDecodedText, tQtyRef.current);
    setAddScan(false);
    setBarcode("");
  };



  {/* ดึงข้อมูล History จาก IndexedDB */ }
  const C_PRCxFetchHistoryList = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }

    const transaction = oDb.transaction("TCNTHistoryTransfer", "readonly");
    const store = transaction.objectStore("TCNTHistoryTransfer");
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

    const transaction = oDb.transaction("TCNTProductTransfer", "readonly");
    const store = transaction.objectStore("TCNTProductTransfer");
    const request = store.getAll();

    request.onsuccess = () => {
      if (request.result) {
        const mappedData: Product[] = request.result.map((item: Product) => ({
          FNId: item.FNId,
          FTBarcode: item.FTBarcode,
          FCCost: 0,
          FNQuantity: item.FNQuantity,
          FTRefDoc: item.FTRefDoc,
          FTRefSeq: item.FTRefSeq,
          FTXthDocKey: item.FTXthDocKey,
          FTBchCode: item.FTBchCode,
          FTAgnCode: item.FTAgnCode,
          FTUsrName: item.FTUsrName,
          FDCreateOn: item.FDCreateOn,
          FTPORef: item.FTPORef,
          FTXthDocType: item.FTXthDocType ?? "0"
        }));

        console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData);
        setProductHistoryList(mappedData);
      }
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };
  {/* เพิ่มสินค้า */ }
  const C_ADDxProduct = (barcode: string, ptQty: string) => {

    if (!barcode || !ptQty) {
      alert("กรุณากรอกบาร์โค้ด หรือจำนวนให้ครบถ้วน");
      return;
    }

    setIsDisabledRefDoc(true);
    
    setProducts((prevProducts) => {
  // หา index ของ product ที่ barcode ตรงกัน
  const existingIndex = prevProducts.findIndex(
    (p) => p.FTBarcode === barcode
  );

  if (existingIndex !== -1 && nListMerge === 1) {
    // ถ้ามี และ nListMerge === 1 → บวกจำนวน
    const updatedProducts = [...prevProducts];
    const updatedQuantity = updatedProducts[existingIndex].FNQuantity + parseInt(ptQty);

    updatedProducts[existingIndex] = {
      ...updatedProducts[existingIndex],
      FNQuantity: updatedQuantity
    };

    // อัปเดตใน IndexedDB
    C_UPDxProductTmpToIndexedDB(barcode, updatedQuantity);

    return updatedProducts;
  } else {
    // ถ้าไม่มี หรือ nListMerge !== 1 → สร้างใหม่
    const newId = Math.max(...prevProducts.map((p) => p.FNId), 0) + 1;

    const newProduct: Product = {
      FNId: newId,
      FTBarcode: barcode,
      FCCost: 0,                                    // ตามเดิม
      FNQuantity: parseInt(ptQty) || 1,             // fallback = 1 ถ้า NaN
      FTRefDoc: refDoc || "",
      FTRefSeq: tRefSeq || "",
      FTXthDocKey: "TCNTPdtTbxHD",                 // ตาม context
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FDCreateOn: C_SETxFormattedDate(),
      FTPORef: searchText || "",                    // ใช้ searchText แทน
      FTXthDocType: refDocType
    };

    // เพิ่มใน IndexedDB
    C_INSxProductTmpToIndexedDB([newProduct]);

    return [...prevProducts, newProduct];
  }
});

    setBarcode("");
    setQuantity("1");
  };
  {/* ลบสินค้า */ }
  const removeProduct = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .filter((product) => product.FNId !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );

    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    C_DELxProductTmpByFNId(oDb, id, "TCNTProductTransferTmp");


  };


  const C_SETxViewHistoryProduct = (history: History) => {
    const oFiltered = oProductHistoryList?.filter((product) => product.FTRefSeq === history.FTRefSeq);
    setHistoryDate(history.FTDate);
    setHistoryRefDoc(history.FTRefDoc);
    setFilteredProduct(oFiltered || []);
    setIsProductOpen(true);
  };
  {/* export excel */ }
  const exportProduct = () => {
    const formattedProducts = oProducts.map(product => ({
      tProductCode: "", // Corrected property name
      tBarcode: product.FTBarcode,
      tQTY: product.FNQuantity.toString()
    }));
    exportToExcel(formattedProducts);
  };
  const C_INSxHistoryToIndexedDB = async (pnType: number) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    const currentDate = new Date().toLocaleDateString("th-TH");
    console.log("✅ tRefSeq History:", tRefSeq);
    const historyData: History = {
      FTDate: currentDate,
      FTRefDoc: refDoc,
      FNStatus: pnType,
      FTRefSeq: tRefSeq
    };

    await C_INSxDataIndexedDB(oDb, "TCNTHistoryTransfer", [historyData]);
  };
  const C_INSxProductToIndexedDB = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    console.log("✅ tRefSeq Product:", tRefSeq);
    const productData = oProducts.map((oProducts) => ({
      FNId: oProducts.FNId,
      FTBarcode: oProducts.FTBarcode,
      FCCost: 0,
      FNQuantity: oProducts.FNQuantity,
      FTRefDoc: oProducts.FTRefDoc,
      FTRefSeq: tRefSeq,
      FTXthDocKey: "TCNTPdtTbxHD",
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FDCreateOn: C_SETxFormattedDate(),
      FTPORef: searchText,
      FTXthDocType: oProducts.FTXthDocType ?? "0"
    }));

    await C_INSxDataIndexedDB(oDb, "TCNTProductTransfer", productData);
    setProducts([]);
  };
  async function C_PRCxSaveDB(pnType: number) {
    //pnType 1 = Upload, 2 = Export, 0 = Upload Error
    try {
      console.log("✅ หา RefSeq ใหม่");
      const newRefSeq = C_GETtGenerateRandomID();
      setRefSeq(newRefSeq);
      console.log("✅ RefSeq = ", newRefSeq);

      console.log("✅ ข้อมูล History ถูกบันทึก");
      await C_INSxHistoryToIndexedDB(pnType);

      console.log("✅ ข้อมูล Product ถูกบันทึก");
      await C_INSxProductToIndexedDB();

      console.log("✅ เข้าลบข้อมูล History, Data ที่เกิน limit");
      if (!oDb) {
        console.log("❌ Database is not initialized");
        return;
      }
      await C_DELxLimitData(oDb, "TCNTHistoryTransfer", "TCNTProductTransfer");

      console.log("✅ ลบข้อมูล Product Tmp");
      await C_DELoDataTmp(oDb, "TCNTProductTransferTmp");


      console.log("✅ โหลดข้อมูล List ใหม่");
      await C_PRCxFetchHistoryList();
      await C_PRCxFetchProductHistoryList();
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดใน C_PRCxSaveDB", error);
    } finally {
      setIsDisabledRefDoc(false);
      setRefDoc("");
      setRefDocType("1");
      setSearchText("");
      if (isNetworkOnline) {
        alert("✅ บันทึกข้อมูลสำเร็จ");
      }
    }
  }


  const C_INSxProductTmpToIndexedDB = async (data: Product[]) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    await C_INSxDataIndexedDB(oDb, "TCNTProductTransferTmp", data);

  };

    const C_UPDxProductTmpToIndexedDB = async (barcode:string, data:number) => {
        if (!oDb) {
          console.log("❌ Database is not initialized");
          return;
        }
        await C_UPDxDataIndexedDB(oDb, "TCNTProductTransferTmp", barcode , data);
    
      };



  const C_PRCxFetchProductTmpList = async () => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }

    const transaction = oDb.transaction("TCNTProductTransferTmp", "readonly");
    const store = transaction.objectStore("TCNTProductTransferTmp");
    const request = store.getAll();

    request.onsuccess = () => {
      if (request.result) {
        const mappedData: Product[] = request.result.map((item: Product) => ({
          FNId: item.FNId,
          FTBarcode: item.FTBarcode,
          FCCost: 0,
          FNQuantity: item.FNQuantity,
          FTRefDoc: item.FTRefDoc,
          FTRefSeq: item.FTRefSeq,
          FTXthDocKey: item.FTXthDocKey,
          FTBchCode: item.FTBchCode,
          FTAgnCode: item.FTAgnCode,
          FTUsrName: item.FTUsrName,
          FDCreateOn: item.FDCreateOn,
          FTPORef: item.FTPORef,
          FTXthDocType: item.FTXthDocType ?? "0"
        }));

        console.log("🔹 ข้อมูลที่ได้จาก TCNTProductTransferTmp:", mappedData);
        if (mappedData.length > 0) {
          setIsDisabledRefDoc(true);
          setProducts(mappedData);
          setRefDoc(mappedData[0].FTRefDoc);
          setRefDocType(mappedData[0].FTXthDocType ?? "0");
          setSearchText(mappedData[0].FTPORef || "");
        }

      }
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงข้อมูลจาก TCNTProductTransferTmp ได้");
    };
  };



  async function C_PRCxUploadeWebServices() {
    setIsLoading(true);
    if (!oProducts || oProducts.length === 0) {
      setIsLoading(false);
      alert("❌ ไม่มีข้อมูลสินค้า");
      return;
    }
    if (!isNetworkOnline) {
      C_PRCxSaveDB(0);
      alert("❌ Upload ไม่สำเร็จ");
      setIsLoading(false);
      return;
    }
    // //  Upload ผ่าน Web Services
    // C_INSxProducts(oProducts);
    try {
      if (oUserInfo) {
        const success = await C_INSxProducts(oProducts, oUserInfo);
        if (success) {
          C_PRCxSaveDB(1);
        } else {
          C_PRCxSaveDB(0);
          alert("❌ Upload ข้อมูลไม่สำเร็จ");
          setIsLoading(false);
          return;
        }
      } else {
        throw new Error("❌ ไม่พบข้อมูลผู้ใช้");
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการอัพโหลดข้อมูล:", error);
      alert("❌ เกิดข้อผิดพลาดในการอัพโหลดข้อมูล");
    } finally {
      setIsLoading(false); // ปิด loading progress
    }
    setIsLoading(false);
  }
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
    C_PRCxSaveDB(2);

    setIsLoading(false);
  }
  const C_SETxViewRepeat = (history: History) => {
    // กรองข้อมูลสินค้าตาม FTRefSeq
    const oFiltered = oProductHistoryList?.filter((product) => product.FTRefSeq === history.FTRefSeq);

    if (!oFiltered || oFiltered.length === 0) {
      console.warn("⚠ ไม่มีข้อมูลสินค้าในรายการนี้");
      return;
    }

    // ตั้งค่า State ของ Products ก่อนทำงาน
    setIsRepeat(true);
    setProducts(oFiltered);
    setRefDoc(history.FTRefDoc);
    setRefDocType(oFiltered[0]?.FTXthDocType ?? "0");
    setSearchText(oFiltered[0]?.FTPORef || "");

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
      await C_DELoDataTmp(oDb, "TCNTProductTransferTmp");
      setProducts([]);
      setRefDoc("");
      setRefDocType("1");
      setSearchText("");
      setIsDisabledRefDoc(false);
    } else {
      console.log("❌ Database is not initialized");
    }

  };

  {/* ปิด Dropdown เมื่อคลิกข้างนอก */ }
  const C_SETxCloseDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };
  return (
    <div className="p-4 ms-1  bg-white" onClick={C_SETxCloseDropdown}>
      <div className="flex flex-col md:flex-row items-start md:items-center pb-6">
        <div className="flex flex-row w-full py-2">
          {/* หัวข้อ */}
          <h1 className="text-xl font-bold md:pb-0">รับ / โอนสินค้าระหว่างสาขา</h1>
          {/* ปุ่ม 3 จุด จอเล็ก */}
          <button
            className="md:hidden ml-2 p-2 rounded-md ml-auto text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>
        {/* ปุ่ม 3 จุด (สำหรับ desktop) */}
        <div className="md:ml-auto pt-2 relative flex items-center">
          <button
            className="hidden md:block p-2 rounded-md text-gray-500 hover:text-gray-700 text-[18px]"
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
              onClick={C_PRCxUploadeWebServices}
            >
              <FaFileAlt className="mr-2 text-gray-700" /> บ้นทึก รอนำเข้ารายการ
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
      <div className="space-y-4 pt-2">

        <div>
          <label htmlFor="transfer-ref-doc-type" className="block mb-1 text-gray-700 text-[14px]">
            ประเภทเอกสารอ้างอิง
          </label>
          <select
            id="transfer-ref-doc-type"
            value={refDocType}
            disabled={isDisabledRefDoc}
            onChange={(event) => setRefDocType(event.target.value as RefDocType)}
            className="min-h-[52px] w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[16px] leading-7 text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="1">ใบจ่ายโอน</option>
            <option value="2">ใบขอโอน</option>
            <option value="0">ไม่ระบุประเภท</option>
          </select>
        </div>

        <InputWithLabel
          type="text"
          label={"เลขที่อ้างอิง"}
          icon={<FaRegCalendar />}
          value={refDoc}
          disabled={isDisabledRefDoc}
          onChange={setRefDoc}
          placeholder="ระบุเลขที่อ้างอิง"
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
          onClick={bScanning ? C_PRCxStopScanner : C_PRCxStartScanner}
          inputRef={oBarcodeRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (bCheckAutoScan) {
                C_PRCxScanBar(barcode);
              }else {
                oQtyRef.current?.focus();
              }
            }
          }}
          inputMode={bCheckKeyboard ? "none" : "numeric"}
          readOnly={isAddScan}
        />



        <InputWithLabelAndButton
          type="number"
          value={quantity}
          onChange={setQuantity}
          inputRef={oQtyRef}
          label={"จำนวนที่ได้รับ"}
          icon={<FaPlus />}
          onClick={() => C_ADDxProduct(barcode, tQtyRef.current)}
        />
      </div>

      {/* ตารางสินค้า */}
      <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 border text-m text-[14px]">
            <th className="p-2">ลำดับ</th>
            <th className="p-2">บาร์โค้ด</th>
            <th className="p-2">จำนวน</th>
            <th className="p-2">จัดการ</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {oProducts.slice().reverse().map((oProduct, index) => (
            <tr key={index} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{oProducts.length - index}</td>
              <td className="p-2">{oProduct.FTBarcode}</td>
              <td className="p-2">{oProduct.FNQuantity}</td>
              <td className="p-2">
                <button onClick={() => removeProduct(oProduct.FNId)} className="text-red-500">
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

        <div className="flex flex-col w-full md:w-auto md:ml-auto pt-2 relative">
          <label className="flex items-center text-gray-500 text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={bCheckAutoScan}
              onChange={() => {
                setChecked(!bCheckAutoScan);
                oBarcodeRef.current?.focus();
              }}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2">บันทึกอัตโนมัติหลังสแกนบาร์โค้ด</span>
          </label>

          <label className="flex items-center text-gray-500 text-[14px] cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={bCheckKeyboard}
              onChange={() => {
                setCheckKeyboard(!bCheckKeyboard)
                oBarcodeRef.current?.focus();
              }}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2">ปิดคีย์บอร์ดสำหรับสแกนบาร์โค้ด</span>
          </label>
        </div>
      </div>


      <div className="flex w-full md:w-auto md:ml-auto pt-2 mb-10 relative justify-end">
        <div>
          <button className="bg-blue-600 text-white px-6 py-2 flex items-center justify-center rounded-md"
            onClick={C_PRCxSaveClearTmpData}>
            ล้างข้อมูล
          </button>
        </div>
      </div>


      {/* ประวัติการทำรายการ */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        oDataHistory={historyList}
        onView={C_SETxViewHistoryProduct}
        onRepeat={C_SETxViewRepeat} />

      {/* ข้อมูลประวัติสินค้า */}
      <ProductTranferNStockModal
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        oDataProduct={oFilteredProduct || []}
        tDate={tHistoryDate}
        tRefDoc={tHistoryRefDoc}
        tRefDocLabel="เลขที่อ้างอิง"
      />

      {isLoadingScanAuto && (
        <div className="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          {/* ข้อความแจ้งเตือน */}
          <p className="mt-4 text-white text-lg">กำลังเพิ่มข้อมูล...</p>
        </div>
      )}

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50 z-[9999]">
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

