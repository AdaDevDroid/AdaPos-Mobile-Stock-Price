"use client";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { CCameraScanner } from "@/hooks/CCameraScanner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useAppUpdateGuard } from "@/hooks/CAppUpdate";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory } from "react-icons/fa";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import exportToExcel from '@/hooks/CTransferreceiptoutToExcel';
import { History, Product, UserInfo } from "@/models/models"
import { C_PRCxOpenIndexedDB, C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB, C_GETxConfig, C_DELoDataTmp, C_DELxProductTmpByFNId, C_UPDxDataIndexedDB } from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import HistoryModal from "@/components/HistoryModal";
import ProductReceiveModal from "@/components/ProductReceiveModal";
import { C_GETtGenerateRandomID, C_INSxProducts, C_SETxFormattedDate } from "@/hooks/CSP";
import RepeatModal from "@/components/RepeatModal";


export default function Receive() {
  const [tRefDoc, setRefDoc] = useState("");
  const [isDisabledRefDoc, setIsDisabledRefDoc] = useState(false);
  const [oProducts, setProducts] = useState<Product[]>([]);
  const [tBarcode, setBarcode] = useState("");
  const [tCost, setCost] = useState("");
  const [tQty, setQty] = useState("1");
  const [tSearchPoText, setSearchText] = useState("");
  const [oPendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [oHistoryList, setHistoryList] = useState<History[]>([]);
  const [oProductHistoryList, setProductHistoryList] = useState<Product[]>();
  const [oDb, setDB] = useState<IDBDatabase | null>(null);
  const tCostRef = useRef(tCost);
  const tQtyRef = useRef(tQty);
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tRefSeq, setRefSeq] = useState("");
  const [tHistoryDate, setHistoryDate] = useState("");
  const [tHistoryRefDoc, setHistoryRefDoc] = useState("");
  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);

  const isNetworkOnline = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScanAuto, setIsLoadingScanAuto] = useState(false);
  const [isAddScan, setAddScan] = useState(false);
  const [bCheckAutoScan, setChecked] = useState(true);
  const [bCheckKeyboard, setCheckKeyboard] = useState(false);
  const bCheckedRef = useRef(bCheckAutoScan);
  const [bDropdownOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);

  const [nFixPntShow, setFixPntShow] = useState(4);
  const oBarcodeRef = useRef<HTMLInputElement>(null);
  const oQtyRef = useRef<HTMLInputElement>(null);

  const nListMerge = 1; // รวมรายการ 1 รวม , 0 ไม่รวม  

  {/* เช็ค User */ }
  useAuth();

  useEffect(() => {
    // Focus ไปที่ input เมื่อ component โหลด
    oBarcodeRef.current?.focus();
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

        setRefSeq(C_GETtGenerateRandomID());
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
    bCheckedRef.current = bCheckAutoScan;
    tQtyRef.current = tQty;
  }, [bCheckAutoScan, tQty]);
  useEffect(() => {
    if (oPendingBarcode !== null) {
      C_ADDxProduct(oPendingBarcode, tCost, tQty); // ✅ รอจน `cost` เปลี่ยนก่อนค่อยทำงาน
      setPendingBarcode(null);
    }
  }, [tCost, tQty]);




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
          C_ADDxProduct(ptDecodedText, tCostRef.current, tQtyRef.current);
          setIsLoadingScanAuto(false);
        }
      }, 1000);

      // Resume Scanner หลังจาก countdown วินาที
      setTimeout(() => {
        C_PRCxResumeScanner();
      }, countdown * 1000);
    } else {
      // ให้เคอร์เซอร์ไปที่ input barcode
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
    C_ADDxProduct(ptDecodedText, tCostRef.current, tQtyRef.current);
    setAddScan(false);
    setBarcode("");
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
          FDCreateOn: item.FDCreateOn,
          FTPORef: item.FTPORef
        }));

        console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData);
        setProductHistoryList(mappedData);
      }
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
    };
  };
  const C_INSxHistoryToIndexedDB = async (pnType: number) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    const currentDate = new Date().toLocaleDateString("th-TH");

    const historyData: History = {
      FTDate: currentDate,
      FTRefDoc: tRefDoc,
      FNStatus: pnType,
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
      FTXthDocKey: "TAPTPiHD",
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FDCreateOn: C_SETxFormattedDate(),
      FTPORef: tSearchPoText
    }));
    console.log("Products ก่อน insert ลง DB 2", productData)
    await C_INSxDataIndexedDB(oDb, "TCNTProductReceive", productData);
    setProducts([]);
  };
  {/* Save ขอมูล Tmp */ }
  const C_INSxProductTmpToIndexedDB = async (data: Product[]) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }

    await C_INSxDataIndexedDB(oDb, "TCNTProductReceiveTmp", data);

  };

  const C_UPDxProductTmpToIndexedDB = async (barcode:string, data:number) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    console.log("🔄 อัปเดตข้อมูลใน TCNTProductReceiveTmp สำหรับบาร์โค้ด:", barcode, "ด้วยจำนวน:", data);
    await C_UPDxDataIndexedDB(oDb, "TCNTProductReceiveTmp", barcode , data);

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
          FTPORef: item.FTPORef
        }));

        console.log("🔹 ข้อมูลที่ได้จาก TCNTProductReceiveTmp:", mappedData);
        if (mappedData.length > 0) {
          setIsDisabledRefDoc(true);
          setProducts(mappedData);
          setRefDoc(mappedData[0].FTRefDoc);
          setSearchText(mappedData[0].FTPORef || "");
        }
      }
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงข้อมูลจาก TCNTProductReceiveTmp ได้");
    };
  };


  {/* เพิ่มสินค้า */ }
  const C_ADDxProduct = (ptBarcode: string, ptCost: string, ptQty: string) => {
    if (!ptCost) {
      setCost("0");
      setPendingBarcode(ptBarcode);
      return;
    }

    if (!ptBarcode || !ptQty) {
      alert("กรุณากรอกบาร์โค้ด หรือจำนวนให้ครบถ้วน");
      return;
    }

    setIsDisabledRefDoc(true);

    setProducts((prevProducts) => {
      const existingIndex = prevProducts.findIndex(p => p.FTBarcode === ptBarcode && p.FCCost === parseFloat(ptCost));

      if (existingIndex !== -1 && nListMerge === 1) {
        // ถ้ามี barcode + cost ตรงกัน ให้ update FNQuantity
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          FNQuantity: updatedProducts[existingIndex].FNQuantity + parseInt(ptQty)
        };
        const updatedQuantity = updatedProducts[existingIndex].FNQuantity;

        // อัปเดต IndexedDB ด้วยข้อมูลที่อัปเดตแล้ว
        C_UPDxProductTmpToIndexedDB(ptBarcode, updatedQuantity);
        
        return updatedProducts;
      } else {
        const newId = Math.max(...prevProducts.map(p => p.FNId), 0) + 1;

        const newProduct = {
          FNId: newId,
          FTBarcode: ptBarcode,
          FCCost: parseFloat(ptCost),
          FNQuantity: parseInt(ptQty),
          FTRefDoc: tRefDoc,
          FTRefSeq: tRefSeq,
          FTXthDocKey: "TAPTPiHD",
          FTBchCode: oUserInfo?.FTBchCode || "",
          FTAgnCode: oUserInfo?.FTAgnCode || "",
          FTUsrName: oUserInfo?.FTUsrName || "",
          FDCreateOn: C_SETxFormattedDate(),
          FTPORef: tSearchPoText
        };

        C_INSxProductTmpToIndexedDB([newProduct]);
        return [...prevProducts, newProduct];
      }
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
    C_DELxProductTmpByFNId(oDb, id, "TCNTProductReceiveTmp");
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
  async function C_PRCxSaveDB(pnType: number) {
    //pnType 1 = Upload, 2 = Export, 0 = Upload Error
    try {
      console.log("✅ หา RefSeq ใหม่");
      const newRefSeq = C_GETtGenerateRandomID();
      setRefSeq(newRefSeq);
      console.log("✅ ข้อมูล History ถูกบันทึก");
      await C_INSxHistoryToIndexedDB(pnType);

      console.log("✅ ข้อมูล Product ถูกบันทึก");
      await C_INSxProductToIndexedDB();



      console.log("✅ เข้าลบข้อมูล History, Data ที่เกิน limit");
      if (!oDb) {
        console.log("❌ Database is not initialized");
        return;
      }
      await C_DELxLimitData(oDb, "TCNTHistoryReceive", "TCNTProductReceive");

      console.log("✅ ลบข้อมูล Product Tmp");
      await C_DELoDataTmp(oDb, "TCNTProductReceiveTmp");
      console.log("✅ โหลดข้อมูล List ใหม่");
      await C_PRCxFetchHistoryList();
      await C_PRCxFetchProductHistoryList();
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดใน C_PRCxSaveDB", error);
    } finally {
      setRefDoc("");
      setSearchText("");
      setIsDisabledRefDoc(false);
      if (pnType === 1) {
        alert("✅ บันทึกข้อมูลสำเร็จ");
      }
    }
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
      alert("❌ Upload ไม่สำเร็จ Internet ไม่พร้อมใช้งาน");
      setIsLoading(false);
      return;
    }
    console.log("Products ก่อนอัพโหลด", oProducts)
    // //  Upload ผ่าน Web Services
    // C_INSxProducts(oProducts);
    try {
      if (!oUserInfo) {
        throw new Error("User info is not available");
      }
      const success = await C_INSxProducts(oProducts, oUserInfo);
      if (success) {
        C_PRCxSaveDB(1);
      } else {
        C_PRCxSaveDB(0);
        alert("❌ Upload ข้อมูลไม่สำเร็จ");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการอัพโหลดข้อมูล:", error);
      alert("❌ เกิดข้อผิดพลาดในการอัพโหลดข้อมูล");
    } finally {
      setIsLoading(false); // ปิด loading progress
    }
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
    C_PRCxSaveDB(2);


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
    setSearchText(oFiltered[0]?.FTPORef || "");
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
      await C_DELoDataTmp(oDb, "TCNTProductReceiveTmp");
      setProducts([]);
      setRefDoc("");
      setSearchText("");
      setIsDisabledRefDoc(false);
    } else {
      console.log("❌ Database is not initialized");
    }

  };


  useAppUpdateGuard(Boolean(tRefDoc || tBarcode || tCost || tQty !== "1" || oProducts.length || oPendingBarcode ||
    isLoading || isLoadingScanAuto || isAddScan || bScanning || isHistoryOpen || isProductOpen || isRepeat));

  return (
    <div className="p-4 ms-1  bg-white" onClick={C_SETxCloseDropdown}>
      <div className="flex flex-col md:flex-row items-start md:items-center pb-6">
        <div className="flex flex-row w-full py-2">
          {/* หัวข้อ */}
          <h1 className="text-xl font-bold md:pb-0">รับสินค้าจากผู้จำหน่าย</h1>
          {/* ปุ่ม 3 จุด จอเล็ก */}
          <button
            className="md:hidden ml-2 p-2 rounded-md ml-auto text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!bDropdownOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>
        {/* ปุ่ม 3 จุด (สำหรับ desktop) */}
        <div className="md:ml-auto pt-2 relative flex items-center">
          <button
            className="hidden md:block p-2 rounded-md text-gray-500 hover:text-gray-700 text-[18px]"
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
      <div className="space-y-4 pt-2">

        <InputWithLabel
          type="text"
          label={"เลขที่อ้างอิง"}
          icon={<FaRegCalendar />}
          value={tRefDoc}
          onChange={setRefDoc}
          disabled={isDisabledRefDoc}
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
          value={tBarcode}
          onChange={setBarcode}
          icon={bScanning ? <FiCameraOff /> : <FiCamera />}
          placeholder="สแกนหรือป้อนบาร์โค้ด"
          onClick={bScanning ? C_PRCxStopScanner : C_PRCxStartScanner}
          inputRef={oBarcodeRef}
          onKeyDown={(e) => {
            console.log("Key pressed:", e.key);
            if (e.key === "Enter") {
              if (bCheckAutoScan) {
                C_PRCxScanBar(tBarcode);
              }else {
                oQtyRef.current?.focus();
              }
            }
          }}
          inputMode={bCheckKeyboard ? "none" : "numeric"}
          readOnly={isAddScan}
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
          inputRef={oQtyRef}
          icon={<FaPlus />}
          onClick={() => C_ADDxProduct(tBarcode, tCost, tQty)}
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
          {oProducts.slice().reverse().map((oProduct, index) => (
            <tr key={oProduct.FNId} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{oProducts.length - index}</td>
              <td className="p-2">{oProduct.FTBarcode}</td>
              <td className="p-2">{oProduct.FCCost.toFixed(nFixPntShow)}</td>
              <td className="p-2">{oProduct.FNQuantity}</td>
              <td className="p-2">
                <button onClick={() => C_DELxProduct(oProduct.FNId)} className="text-red-500">
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

