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
import exportToExcel from '@/hooks/CAdjustStockToExcel';
import { History, Product, UserInfo } from "@/models/models"
import { C_PRCxOpenIndexedDB, C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB ,C_DELoDataTmp, C_DELxProductTmpByFNId} from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import HistoryModal from "@/components/HistoryModal";
import ProductTranferNStockModal from "@/components/ProductTransferNStockModal";
import { C_INSxStock, C_SETxFormattedDate } from "@/hooks/CSP";
import RepeatModal from "@/components/RepeatModal";



export default function ReceiveGoods() {

  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [bDropdownOpen, setIsOpen] = useState(false);
  const [tHistoryDate, setHistoryDate] = useState("");
  const [tHistoryRefDoc, setHistoryRefDoc] = useState("");
  const [tRefDoc, setRefDoc] = useState("");
  const [oProducts, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [bCheckAutoScan, setChecked] = useState(false);
  const [searchText, setSearchText] = useState<string>(""); // string
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScanAuto, setIsLoadingScanAuto] = useState(false);
  const checkedRef = useRef(bCheckAutoScan);
  const [oProductHistoryList, setProductHistoryList] = useState<Product[]>();
  const [historyList, setHistoryList] = useState<History[]>([]);
  const [oDb, setDB] = useState<IDBDatabase | null>(null);
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tRefSeq, setRefSeq] = useState("");
  const isNetworkOnline = useNetworkStatus();
  const [isRepeat, setIsRepeat] = useState(false);

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
        C_PRCxFetchProductTmpList();
      }
    }, [oDb]);

  {/* ใช้ useEffect ในการเก็บค่า checked และ cost  */ }
  useEffect(() => {
    checkedRef.current = bCheckAutoScan;
  }, [bCheckAutoScan]);


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
          C_ADDxProduct(ptDecodedText);
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



  {/* ดึงข้อมูล History จาก IndexedDB */ }
  const C_PRCxFetchHistoryList = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }

    const transaction = oDb.transaction("TCNTHistoryStock", "readonly");
    const store = transaction.objectStore("TCNTHistoryStock");
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

    const transaction = oDb.transaction("TCNTProductStock", "readonly");
    const store = transaction.objectStore("TCNTProductStock");
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
          FDCreateOn: item.FDCreateOn
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

    await C_INSxDataIndexedDB(oDb, "TCNTHistoryStock", [historyData]);
  };
  const C_INSxProductToIndexedDB = async () => {
    if (!oDb) {
      console.error("❌ Database is not initialized");
      return;
    }

    const productData = oProducts.map((oProducts) => ({
      FNId: oProducts.FNId,
      FTBarcode: oProducts.FTBarcode,
      FCCost: 0,
      FNQuantity: oProducts.FNQuantity,
      FTRefDoc: oProducts.FTRefDoc,
      FTRefSeq: oProducts.FTRefSeq,
      FTXthDocKey: "TCNTDocDTTmpAdj",
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FDCreateOn: C_SETxFormattedDate()
    }));

    await C_INSxDataIndexedDB(oDb, "TCNTProductStock", productData);
    setProducts([]);
  };

  {/* เพิ่มสินค้า */ }
  const C_ADDxProduct = (ptBarcode: string) => {


    if (!ptBarcode || !quantity) {
      alert("❌ กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setProducts((prevProducts) => {
      const newId = Math.max(...prevProducts.map(p => p.FNId), 0) + 1;

      const newProduct: Product = {
        FNId: newId,
        FTBarcode: ptBarcode,
        FCCost: 0,
        FNQuantity: parseInt(quantity),
        FTRefDoc: tRefDoc,
        FTRefSeq: tRefSeq,
        FTXthDocKey: "TCNTDocDTTmpAdj",
        FTBchCode: oUserInfo?.FTBchCode || "",
        FTAgnCode: oUserInfo?.FTAgnCode || "",
        FTUsrName: oUserInfo?.FTUsrName || "",
        FDCreateOn: C_SETxFormattedDate()
      };


      return [...prevProducts, newProduct];
    });

    setBarcode("");
    setQuantity("1");
  };

  {/* ลบสินค้า */ }
  const C_DELxProduct = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .filter((product) => product.FNId !== id)
        .map((product, index) => ({ ...product, id: index + 1 })) //รีเซ็ต ID ใหม่
    );
    
        if (!oDb) {
          console.error("❌ Database is not initialized");
          return;
        }
        C_DELxProductTmpByFNId(oDb,id,"TCNTProductStockTmp");
  };


  {/* export excel */ }
  const exportProduct = () => {
    const oDataProducts = oProducts.map(product => ({
      tProductCode: "000001",
      tBarcode: product.FTBarcode,
      tStockCode: "",
      tQTY: product.FNQuantity.toString(),
      dCreateOn: C_SETxFormattedDate()
    }));
    exportToExcel(oDataProducts);
  };


  {/* ปิด Dropdown เมื่อคลิกข้างนอก */ }
  const C_SETxCloseDropdown = () => {
    if (bDropdownOpen) {
      setIsOpen(false);
    }
  };
  const C_SETxViewHistoryProduct = (history: History) => {
    const oFiltered = oProductHistoryList?.filter((product) => product.FTRefDoc === history.FTRefDoc);
    setHistoryDate(history.FTDate);
    setHistoryRefDoc(history.FTRefDoc);
    setFilteredProduct(oFiltered || []);
    setIsProductOpen(true);
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
        await C_DELxLimitData(oDb, "TCNTHistoryStock", "TCNTProductStock");
        
        
        console.log("✅ ลบข้อมูล Product Tmp");
        await C_DELoDataTmp(oDb,"TCNTProductStockTmp");

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

    //  Upload ผ่าน Web Services
    C_INSxStock(oProducts);
    // Save Data to IndexedDB
    C_PRCxSaveDB();

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
    C_PRCxSaveDB();

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
        console.error("❌ เกิดข้อผิดพลาดการทำซ้ำ:", error);
      }
  
      // ปิด Modal หลังจากทำงานเสร็จ
      setIsRepeat(false);
    };


    const C_INSxProductTmpToIndexedDB = async () => {
      if (!oDb) {
        console.error("❌ Database is not initialized");
        return;
      }

      await C_DELoDataTmp(oDb,"TCNTProductStockTmp");

      const productData = oProducts.map((oProducts) => ({
        FNId: oProducts.FNId,
        FTBarcode: oProducts.FTBarcode,
        FCCost: 0,
        FNQuantity: oProducts.FNQuantity,
        FTRefDoc: oProducts.FTRefDoc,
        FTRefSeq: oProducts.FTRefSeq,
        FTXthDocKey: "TCNTDocDTTmpAdj",
        FTBchCode: oUserInfo?.FTBchCode || "",
        FTAgnCode: oUserInfo?.FTAgnCode || "",
        FTUsrName: oUserInfo?.FTUsrName || "",
        FDCreateOn: C_SETxFormattedDate()
      }));
  
      await C_INSxDataIndexedDB(oDb, "TCNTProductStockTmp", productData);
      alert("✅ บันทึกข้อมูลสำเร็จ");
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

    async function C_PRCxSaveClearTmpData() {
     
      // Clear Tmp Data to IndexedDB
      if (oDb) {
        console.log("✅ ลบข้อมูล Product Tmp");
        await C_DELoDataTmp(oDb,"TCNTProductStockTmp");
        setProducts([]);
      } else {
        console.error("❌ Database is not initialized");
      }
 
    };

    
    const C_PRCxFetchProductTmpList = async () => {
      if (!oDb) {
        console.error("❌ Database is not initialized");
        return;
      }

      const transaction = oDb.transaction("TCNTProductStockTmp", "readonly");
      const store = transaction.objectStore("TCNTProductStockTmp");
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
          }));

          console.log("🔹 ข้อมูลที่ได้จาก TCNTProductStockTmp:", mappedData);
          if (mappedData.length > 0){
            setProducts(mappedData);
          }
          
        }
      };

      request.onerror = () => {
        console.error("❌ ไม่สามารถดึงข้อมูลจาก TCNTProductStockTmp ได้");
      };
    };
  return (
    <div className="p-4 ms-1 mx-auto bg-white" onClick={C_SETxCloseDropdown}>
      <div className="flex flex-col md:flex-row items-start md:items-center pb-6">
        <div className="flex flex-row w-full py-2">
          {/* หัวข้อ */}
          <h1 className="text-2xl font-bold md:pb-0">ตรวจนับสต็อก</h1>
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
            value={searchText}
            onChange={setSearchText}
            placeholder="ค้นหาใบ PO"
            icon={<GrDocumentText />}
            onClick={() => alert(`ข้อความ: ${searchText}`)}
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
      <div className="space-y-4 pt-4">

        <InputWithLabel
          type="text"
          label={"ระบุจุดตรวจนับ"}
          icon={<FaRegCalendar />}
          value={tRefDoc}
          onChange={setRefDoc}
          placeholder="ระบุจุดตรวจนับ เช่น ชั้นวาง A1, คลังหลัง"
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
          value={barcode}
          onChange={setBarcode}
          icon={bScanning ? <FiCameraOff /> : <FiCamera />}
          placeholder="สแกนหรือป้อนบาร์โค้ด"
          onClick={bScanning ? C_PRCxStopScanner : C_PRCxStartScanner}
        />

        <InputWithLabelAndButton
          type="number"
          value={quantity}
          onChange={setQuantity}
          label={"จำนวนที่นับได้"}
          icon={<FaPlus />}
          onClick={() => C_ADDxProduct(barcode)}
        />
      </div>

      {/* ตารางสินค้า */}
      <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 border text-m text-[14px]">
            <th className="p-2">ลำดับ</th>
            <th className="p-2">บาร์โค้ด</th>
            <th className="p-2">จำนวนที่นับได้</th>
            <th className="p-2">จัดการ</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {oProducts.map((product, index) => (
            <tr key={product.FNId} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{product.FTBarcode}</td>
              <td className="p-2">{product.FNQuantity}</td>
              <td className="p-2">
                <button onClick={() => C_DELxProduct(product.FNId)} className="text-red-500">
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
          <label className="flex items-center text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={bCheckAutoScan}
              onChange={() => setChecked(!bCheckAutoScan)}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-[14px]">บันทึกอัตโนมัติหลังสแกนบาร์โค้ด</span>
          </label>
        </div>
      </div>
      <div className="flex w-full md:w-auto md:ml-auto pt-2 relative justify-start">
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

