"use client";
import ProductReceiveModal from "@/components/ProductReceiveModal";
import ProductTranferNStockModal from "@/components/ProductTransferNStockModal";
import RepeatModal from "@/components/RepeatModal";
import { C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB, C_PRCxOpenIndexedDB } from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import { useAuth } from "@/hooks/useAuth";
import { History, Product, UserInfo } from "@/models/models";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaSyncAlt, FaRegCalendar, FaExclamationTriangle, FaAngleRight } from "react-icons/fa";
import { C_GETtGenerateRandomID, C_INSxProducts, C_INSxStock, C_SETxFormattedDate } from "@/hooks/CSP";
import exportPurcaseInvoiceToExcel from "@/hooks/CTransferreceiptoutToExcel";
import exportjustStockToExcel from "@/hooks/CAdjustStockToExcel";
import exportTransferbetweenbranchToExcel from "@/hooks/CProducttransferwahouseToExcel";
import { C_GETtPartSessionStorageKey, C_GETtPartUrl } from "@/hooks/CDatabaseSettings";


export default function MainPage() {
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [oReceiveDataHistory, setReceiveDataHistory] = useState<History[]>([]);
  const [oTranferDataHistory, setTranferDataHistory] = useState<History[]>([]);
  const [oStockDataHistory, setStockDataHistory] = useState<History[]>([]);

  const [oReceiveDataProductTmp, setReceiveDataProductTmp] = useState<Product[]>([]);
  const [oTranferDataProductTmp, setTranferDataProductTmp] = useState<Product[]>([]);
  const [oStockDataProductTmp, setStockeDataProductTmp] = useState<Product[]>([]);

  const [oReceiveProductHistoryList, setReceiveProductHistoryList] = useState<Product[]>();
  const [oTranferProductHistoryList, setTranferProductHistoryList] = useState<Product[]>();
  const [oStockProductHistoryList, setStockProductHistoryList] = useState<Product[]>();
  const [isRepeat, setIsRepeat] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isNetworkOnline = useNetworkStatus();

  const [oDb, setDB] = useState<IDBDatabase | null>(null)
  const [tType, setType] = useState("");
  const [tRefSeq, setRefSeq] = useState("");
  const [tRefDoc, setRefDoc] = useState("");
  const [oProducts, setProducts] = useState<Product[]>([]);
  const [tHistoryDate, setHistoryDate] = useState("");
  const [tHistoryRefDoc, setHistoryRefDoc] = useState("");
  const [tHistoryType, setHistoryType] = useState("");
  const [tMobileRefDoc, setMobileRefDoc] = useState("");
  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);
  // เช็ค user login
  useAuth();

  useEffect(() => {
    const reloadKey = C_GETtPartSessionStorageKey("shouldReload");
    const shouldReload = sessionStorage.getItem(reloadKey);
    if (shouldReload === "true") {
      sessionStorage.removeItem(reloadKey);
      window.location.reload();
    }
  }, []);

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
        const oReceiveData = await C_PRCxFetchHistoryList(database, "TCNTHistoryReceive");
        if (oReceiveData) {
          setReceiveDataHistory(oReceiveData);
        }
        const oTranferData = await C_PRCxFetchHistoryList(database, "TCNTHistoryTransfer");
        if (oTranferData) {
          setTranferDataHistory(oTranferData);
        }
        const oStockData = await C_PRCxFetchHistoryList(database, "TCNTHistoryStock");
        if (oStockData) {
          setStockDataHistory(oStockData);
        }

        const oReceiveProductDataTmp = await C_PRCxFetchProductHistoryList(database, "TCNTProductReceiveTmp");
        if (oReceiveProductDataTmp && oReceiveProductDataTmp.length > 0) {
          setReceiveDataProductTmp([oReceiveProductDataTmp[0]]);
        }
        const oTranferProductDataTmp = await C_PRCxFetchProductHistoryList(database, "TCNTProductTransferTmp");
        if (oTranferProductDataTmp && oTranferProductDataTmp.length > 0) {
          setTranferDataProductTmp([oTranferProductDataTmp[0]]);
        }
        const oStockProductDataTmp = await C_PRCxFetchProductHistoryList(database, "TCNTProductStockTmp");
        if (oStockProductDataTmp && oStockProductDataTmp.length > 0) {
          setStockeDataProductTmp([oStockProductDataTmp[0]]);
        }

        const oReceiveProductData = await C_PRCxFetchProductHistoryList(database, "TCNTProductReceive");
        if (oReceiveProductData) {
          setReceiveProductHistoryList(oReceiveProductData);
        }
        const oTranferProductData = await C_PRCxFetchProductHistoryList(database, "TCNTProductTransfer");
        if (oTranferProductData) {
          setTranferProductHistoryList(oTranferProductData);
        }
        const oStockProductData = await C_PRCxFetchProductHistoryList(database, "TCNTProductStock");
        if (oStockProductData) {
          setStockProductHistoryList(oStockProductData);
        }

        setRefSeq(C_GETtGenerateRandomID());

      } catch (error) {
        console.log("❌ เกิดข้อผิดพลาดในการเปิด IndexedDB", error);
      }
    };

    initDB();
  }, []);

  const C_PRCxFetchHistoryList = async (oDb: IDBDatabase, ptTableName: string): Promise<History[]> => {
    return new Promise((resolve, reject) => {
      if (!oDb) {
        console.log("❌ Database is not initialized");
        reject("Database not initialized");
        return;
      }

      const transaction = oDb.transaction(ptTableName, "readonly");
      const store = transaction.objectStore(ptTableName);
      const request = store.getAll();

      request.onsuccess = () => {
        if (request.result) {
          const mappedData: History[] = request.result.map((item: History) => ({
            FTDate: item.FTDate,
            FTRefDoc: item.FTRefDoc,
            FNStatus: item.FNStatus,
            FTRefSeq: item.FTRefSeq,
            FTMobileRefDoc: item.FTMobileRefDoc || "",
          }));

          console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData); // ✅ ตรวจสอบข้อมูลที่ดึงมา
          resolve(mappedData); // return mappedData
        }
      };

      request.onerror = () => {
        console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
        reject("Failed to fetch data from IndexedDB");
      };
    });
  };

  const C_PRCxFetchProductHistoryList = async (oDb: IDBDatabase, ptTableName: string): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
      if (!oDb) {
        console.log("❌ Database is not initialized");
        reject(new Error("Database is not initialized"));
        return;
      }

      const transaction = oDb.transaction(ptTableName, "readonly");
      const store = transaction.objectStore(ptTableName);
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
            FTPORef: item.FTPORef || "", // Provide a default value or extract from item
            FTMobileRefDoc: item.FTMobileRefDoc || "",
          }));

          console.log("🔹 ข้อมูลที่ได้จาก IndexedDB:", mappedData);
          resolve(mappedData); // ✅ Return mappedData ออกไป
        } else {
          resolve([]); // ✅ ถ้าไม่มีข้อมูล ส่ง array ว่างกลับไป
        }
      };

      request.onerror = () => {
        console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB ได้");
        reject(new Error("Failed to fetch data from IndexedDB"));
      };
    });
  };

  const C_SETxViewHistoryProduct = (history: History, ptType: string) => {
    let oFiltered: Product[] = [];

    switch (ptType) {
      case "Recieve":
        oFiltered = oReceiveProductHistoryList?.filter(
          (product) => product.FTRefSeq === history.FTRefSeq
        ) ?? [];
        break;
      case "Transfer":
        oFiltered = oTranferProductHistoryList?.filter(
          (product) => product.FTRefSeq === history.FTRefSeq
        ) ?? [];
        break;
      case "Stock":
        oFiltered = oStockProductHistoryList?.filter(
          (product) => product.FTRefSeq === history.FTRefSeq
        ) ?? [];
        break;
      default:
        console.warn(`❌ ptType: "${ptType}" ไม่ตรงกับประเภทที่กำหนด`);
    }

    setHistoryDate(history.FTDate);
    setHistoryRefDoc(history.FTRefDoc);
    setHistoryType(ptType);
    setFilteredProduct(oFiltered);
    setIsProductOpen(true);
  };

  const C_SETxViewRepeat = (history: History, ptType: string) => {
    let oFiltered: Product[] = [];

    switch (ptType) {
      case "Recieve":
        oFiltered = oReceiveProductHistoryList?.filter(
          (product) => product.FTRefSeq === history.FTRefSeq
        ) ?? [];
        break;
      case "Transfer":
        oFiltered = oTranferProductHistoryList?.filter(
          (product) => product.FTRefSeq === history.FTRefSeq
        ) ?? [];
        break;
      case "Stock":
        oFiltered = oStockProductHistoryList?.filter(
          (product) => product.FTRefSeq === history.FTRefSeq
        ) ?? [];
        break;
      default:
        console.warn(`❌ ptType: "${ptType}" ไม่ตรงกับประเภทที่กำหนด`);
    }

    if (!oFiltered || oFiltered.length === 0) {
      console.warn("⚠ ไม่มีข้อมูลสินค้าในรายการนี้");
      return;
    }

    // ตั้งค่า State ของ Products ก่อนทำงาน
    setProducts(oFiltered);
    setRefDoc(history.FTRefDoc);
    setMobileRefDoc(ptType === "Stock" ? history.FTMobileRefDoc || oFiltered[0]?.FTMobileRefDoc || "" : "");
    setType(ptType);
    setIsRepeat(true);
  };

  const C_PRCxRepeatSelect = async (option: string) => {
    try {
      if (option === "webService") {
        await C_PRCxUploadeWebServices();
        console.log("webService:", oProducts);
      } else if (option === "excel") {
        await C_PRCxExportExcel();
        console.log("excel:", tRefDoc);
      }
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดการทำซ้ำ:", error);
    }

    // ปิด Modal หลังจากทำงานเสร็จ
    setIsRepeat(false);
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
    try {
      //  Upload ผ่าน Web Services
      if (!oUserInfo) {
        throw new Error("User info is not available");
      }
      let success = false;
      if (tType === "Stock") {
        success = await C_INSxStock(oProducts, oUserInfo);
      } else {
        success = await C_INSxProducts(oProducts, oUserInfo);
      }
      if (success) {
        C_PRCxSaveDB(1);
      } else {
        C_PRCxSaveDB(0);
        alert("❌ Upload ข้อมุลไม่สำเร็จ");
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

  {/* export excel */ }
  const exportProduct = () => {
    switch (tType) {
      case "Recieve":
        const formattedProducts = oProducts.map(oProducts => ({
          tBarcode: oProducts.FTBarcode,
          tQTY: oProducts.FNQuantity.toString(),
          tCost: oProducts.FCCost.toString()
        }));
        exportPurcaseInvoiceToExcel(formattedProducts);
        break;
      case "Transfer":
        const formattedTransfer = oProducts.map(oProducts => ({
          tProductCode: "", // Corrected property name
          tBarcode: oProducts.FTBarcode,
          tQTY: oProducts.FNQuantity.toString(),
          tCost: oProducts.FCCost.toString()
        }));
        exportTransferbetweenbranchToExcel(formattedTransfer);
        break;
      case "Stock":
        const formattedStock = oProducts.map(oProducts => ({
          tProductCode: "",
          tBarcode: oProducts.FTBarcode,
          tStockCode: "",
          tQTY: oProducts.FNQuantity.toString(),
          dCreateOn: C_SETxFormattedDate()
        }));
        exportjustStockToExcel(formattedStock);
        break;
      default:
        console.warn(`❌ ptType: "${tType}" ไม่ตรงกับประเภทที่กำหนด`);
    }



  };

  async function C_PRCxSaveDB(pnType: number) {
    //pnType 1 = Upload, 2 = Export, 0 = Upload Error
    try {
      console.log("✅ หา RefSeq ใหม่");
      const newRefSeq = C_GETtGenerateRandomID();
      setRefSeq(newRefSeq);

      let tTaleHistoryName = "";
      let tTaleProductName = "";
      switch (tType) {
        case "Recieve":
          tTaleHistoryName = "TCNTHistoryReceive";
          tTaleProductName = "TCNTProductReceive";
          break;
        case "Transfer":
          tTaleHistoryName = "TCNTHistoryTransfer";
          tTaleProductName = "TCNTProductTransfer";
          break;
        case "Stock":
          tTaleHistoryName = "TCNTHistoryStock";
          tTaleProductName = "TCNTProductStock";
          break;
        default:
          console.log(`❌ ptType: "${tType}" ไม่ตรงกับประเภทที่กำหนด`);
          return;
      }

      console.log("✅ ข้อมูล History ถูกบันทึก");
      await C_INSxHistoryToIndexedDB(pnType);

      console.log("✅ ข้อมูล Product ถูกบันทึก");
      await C_INSxProductToIndexedDB();



      console.log("✅ เข้าลบข้อมูล History, Data ที่เกิน limit");
      if (!oDb) {
        console.log("❌ Database is not initialized");
        return;
      }
      await C_DELxLimitData(oDb, tTaleHistoryName, tTaleProductName);

      console.log("✅ โหลดข้อมูล List ใหม่");
      const oData = await C_PRCxFetchHistoryList(oDb, tTaleHistoryName);
      if (oData) {
        switch (tType) {
          case "Recieve":
            setReceiveDataHistory(oData);
            break;
          case "Transfer":
            setTranferDataHistory(oData);
            break;
          case "Stock":
            setStockDataHistory(oData);
            break;
          default:
            console.log(`❌ ptType: "${tType}" ไม่ตรงกับประเภทที่กำหนด`);
            return;
        }
      }
      const oDataProduct = await C_PRCxFetchProductHistoryList(oDb, tTaleProductName);
      if (oData) {
        switch (tType) {
          case "Recieve":
            setReceiveProductHistoryList(oDataProduct);
            break;
          case "Transfer":
            setTranferProductHistoryList(oDataProduct);
            break;
          case "Stock":
            setStockProductHistoryList(oDataProduct);
            break;
          default:
            console.log(`❌ ptType: "${tType}" ไม่ตรงกับประเภทที่กำหนด`);
            return;
        }
      }

    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดใน C_PRCxSaveDB", error);
    } finally {
      setRefDoc("");
      setMobileRefDoc("");
      alert("✅ บันทึกข้อมูลสำเร็จ");
    }
  };

  const C_INSxHistoryToIndexedDB = async (pnType: number) => {
    let tTaleName = "";
    switch (tType) {
      case "Recieve":
        tTaleName = "TCNTHistoryReceive";
        break;
      case "Transfer":
        tTaleName = "TCNTHistoryTransfer";
        break;
      case "Stock":
        tTaleName = "TCNTHistoryStock";
        break;
      default:
        console.log(`❌ ptType: "${tType}" ไม่ตรงกับประเภทที่กำหนด`);
        return;
    }
    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    const currentDate = new Date().toLocaleDateString("th-TH");

    const historyData: History = {
      FTDate: currentDate,
      FTRefDoc: tRefDoc,
      FNStatus: pnType,
      FTRefSeq: tRefSeq,
      ...(tType === "Stock" ? { FTMobileRefDoc: tMobileRefDoc } : {}),
    };

    await C_INSxDataIndexedDB(oDb, tTaleName, [historyData]);
  };

  const C_INSxProductToIndexedDB = async () => {
    let tTaleName = "";
    let tDocKey = "";
    switch (tType) {
      case "Recieve":
        tTaleName = "TCNTProductReceive";
        tDocKey = "TAPTPiHD";
        break;
      case "Transfer":
        tTaleName = "TCNTProductTransfer";
        tDocKey = "TCNTPdtTbxHD";
        break;
      case "Stock":
        tTaleName = "TCNTProductStock";
        tDocKey = "TCNTPdtAdjStkHD";
        break;
      default:
        console.log(`❌ ptType: "${tType}" ไม่ตรงกับประเภทที่กำหนด`);
        return;
    }
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
      FTXthDocKey: tDocKey,
      FTBchCode: oUserInfo?.FTBchCode || "",
      FTAgnCode: oUserInfo?.FTAgnCode || "",
      FTUsrName: oUserInfo?.FTUsrName || "",
      FTPORef: oProducts.FTPORef || "",
      FDCreateOn: C_SETxFormattedDate(),
      ...(tType === "Stock" ? { FTMobileRefDoc: oProducts.FTMobileRefDoc || tMobileRefDoc } : {}),
    }));
    await C_INSxDataIndexedDB(oDb, tTaleName, productData);
    setProducts([]);
  };

  return (
    <div className="flex flex-col ">
      <div className="flex p-4 justify-between items-center shadow-sm text-gray-500">
        <span className="text-l ml-auto">ชื่อผู้ใช้งาน : {oUserInfo?.FTUsrName} </span>
      </div>

      <div className="container  p-2 space-y-2">
        <h1 className="text-xl font-bold mb-4 ps-2 text-gray-800">ประวัติการทำรายการล่าสุด</h1>

        {(oReceiveDataHistory.length === 0 && oTranferDataHistory.length === 0 && oStockDataHistory.length === 0 &&
          oReceiveDataProductTmp.length === 0 && oTranferDataProductTmp.length === 0 && oStockDataProductTmp.length === 0
        ) && (
            <p className="text-center text-gray-500">ไม่มีประวัติการทำรายการ</p>
          )}

        {oReceiveDataProductTmp.length > 0 &&
          oReceiveDataProductTmp.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-stretch border cursor-pointer"
              onClick={() => { window.location.href = C_GETtPartUrl("/receive"); }}
            >
              {/* ซ้าย: เนื้อหา */}
              <div className="flex flex-col justify-between flex-1 pr-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    รับสินค้าจากผู้จำหน่าย
                  </p>
                  <p className="text-xs text-gray-500 mt-1 mb-1">
                    เลขที่อ้างอิง <span className="font-normal">#{data.FTRefDoc}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" />
                  {data.FDCreateOn.split(" ")[0]}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">ค้างทำรายการ</span>
                  <FaExclamationTriangle className="w-5 h-5 text-[#FFD700]" />
                </div>
                <button
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1"
                >
                  ทำรายการต่อ
                  <FaAngleRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        {oTranferDataProductTmp.length > 0 &&
          oTranferDataProductTmp.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-stretch border cursor-pointer"
              onClick={() => { window.location.href = C_GETtPartUrl("/transfer"); }}
            >
              {/* ซ้าย: เนื้อหา */}
              <div className="flex flex-col justify-between flex-1 pr-4">
                <div>
                  <p className="whitespace-nowrap overflow-hidden text-ellipsis text-sm font-semibold text-gray-800">
                    รับ/โอนสินค้าระหว่างสาขา
                  </p>
                  <p className="text-xs text-gray-500 mt-1 mb-1">
                    เลขที่อ้างอิง <span className="font-normal">#{data.FTRefDoc}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" />
                  {data.FDCreateOn.split(" ")[0]}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">ค้างทำรายการ</span>
                  <FaExclamationTriangle className="w-5 h-5 text-[#FFD700]" />
                </div>
                <button
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1"
                >
                  ทำรายการต่อ
                  <FaAngleRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        {oStockDataProductTmp.length > 0 &&
          oStockDataProductTmp.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-stretch border cursor-pointer"
              onClick={() => { window.location.href = C_GETtPartUrl("/stock"); }}
            >
              {/* ซ้าย: เนื้อหา */}
              <div className="flex flex-col justify-between flex-1 pr-4">
                <div>
                  <p className="whitespace-nowrap overflow-hidden text-ellipsis text-sm font-semibold text-gray-800">
                    ตรวจนับสต็อก
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    จุดตรวจนับ <span className="font-normal">#{data.FTRefDoc || "-"}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" />
                  {data.FDCreateOn.split(" ")[0]}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">ค้างทำรายการ</span>
                  <FaExclamationTriangle className="w-5 h-5 text-[#FFD700]" />
                </div>
                <button
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1"
                >
                  ทำรายการต่อ
                  <FaAngleRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        <div className="h-1"/>

        {oReceiveDataHistory.length > 0 &&
          oReceiveDataHistory.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-stretch border cursor-pointer"
              onClick={() => C_SETxViewHistoryProduct(data, "Recieve")}
            >

              {/* ซ้าย: เนื้อหา */}
              <div className="flex flex-col justify-between flex-1 pr-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    รับสินค้าจากผู้จำหน่าย
                  </p>
                  <p className="text-xs text-gray-500 mt-1 mb-1">
                    เลขที่อ้างอิง <span className="font-normal">#{data.FTRefDoc}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" />
                  {data.FTDate}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {data.FNStatus === 1
                      ? "อัพโหลด สำเร็จ"
                      : data.FNStatus === 2
                        ? "ส่งออกไฟล์ สำเร็จ"
                        : "อัพโหลด ไม่สำเร็จ"}
                  </span>
                  {data.FNStatus === 0 ? (
                    <FaExclamationCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <button
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    C_SETxViewRepeat(data, "Recieve");
                  }}
                >
                  <FaSyncAlt className="w-4 h-4" /> ทำซ้ำ
                </button>
              </div>
            </div>
          ))
        }

        {oTranferDataHistory.length > 0 &&
          oTranferDataHistory.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-stretch border cursor-pointer"
              onClick={() => C_SETxViewHistoryProduct(data, "Transfer")}
            >

              {/* ซ้าย: เนื้อหา */}
              <div className="flex flex-col justify-between flex-1 pr-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    รับ/โอนสินค้าระหว่างสาขา
                  </p>
                  <p className="text-xs text-gray-500 mt-1 mb-1">
                    เลขที่อ้างอิง <span className="font-normal">#{data.FTRefDoc}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" />
                  {data.FTDate}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {data.FNStatus === 1
                      ? "อัพโหลด สำเร็จ"
                      : data.FNStatus === 2
                        ? "ส่งออกไฟล์ สำเร็จ"
                        : "อัพโหลด ไม่สำเร็จ"}
                  </span>
                  {data.FNStatus === 0 ? (
                    <FaExclamationCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <button
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    C_SETxViewRepeat(data, "Transfer");
                  }}
                >
                  <FaSyncAlt className="w-4 h-4" /> ทำซ้ำ
                </button>
              </div>
            </div>
          ))
        }

        {oStockDataHistory.length > 0 &&
          oStockDataHistory.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-stretch border cursor-pointer"
              onClick={() => C_SETxViewHistoryProduct(data, "Stock")} 
            >

              {/* ซ้าย: เนื้อหา */}
              <div className="flex flex-col justify-between flex-1 pr-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    ตรวจนับสต็อก
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    จุดตรวจนับ <span className="font-normal">#{data.FTRefDoc || "-"}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" />
                  {data.FTDate}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {data.FNStatus === 1
                      ? "อัพโหลด สำเร็จ"
                      : data.FNStatus === 2
                        ? "ส่งออกไฟล์ สำเร็จ"
                        : "อัพโหลด ไม่สำเร็จ"}
                  </span>
                  {data.FNStatus === 0 ? (
                    <FaExclamationCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <button
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    C_SETxViewRepeat(data, "Stock");
                  }}
                >
                  <FaSyncAlt className="w-4 h-4" /> ทำซ้ำ
                </button>
              </div>
            </div>
          ))
        }

      </div>

      <div className="h-16"></div>

      {/* ข้อมูลประวัติสินค้า */}
      {tHistoryType === "Stock" ? (
        <ProductTranferNStockModal
          isOpen={isProductOpen}
          onClose={() => setIsProductOpen(false)}
          oDataProduct={oFilteredProduct || []}
          tDate={tHistoryDate}
          tRefDoc={tHistoryRefDoc}
        />
      ) : (
        <ProductReceiveModal
          isOpen={isProductOpen}
          onClose={() => setIsProductOpen(false)}
          oDataProduct={oFilteredProduct || []}
          tDate={tHistoryDate}
          tRefDoc={tHistoryRefDoc}
        />
      )}

      {/* Repeat */}
      <RepeatModal
        isOpen={isRepeat}
        onClose={() => setIsRepeat(false)}
        onOptionSelect={C_PRCxRepeatSelect}
      />

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50 z-[9999]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

    </div>

  );
}
