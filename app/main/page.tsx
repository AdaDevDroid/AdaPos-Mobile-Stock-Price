"use client";
import ProductReceiveModal from "@/components/ProductReceiveModal";
import RepeatModal from "@/components/RepeatModal";
import { C_DELxLimitData, C_GETxUserData, C_INSxDataIndexedDB, C_PRCxOpenIndexedDB } from "@/hooks/CIndexedDB";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import { useAuth } from "@/hooks/useAuth";
import { History, Product, UserInfo } from "@/models/models";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaSyncAlt, FaRegCalendar } from "react-icons/fa";
import { C_INSxProducts, C_SETxFormattedDate } from "@/hooks/CSP";


export default function MainPage() {
  const [oUserInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [oReceiveDataHistory, setReceiveDataHistory] = useState<History[]>([]);
  const [oTranferDataHistory, setTranferDataHistory] = useState<History[]>([]);
  const [oStockDataHistory, setStockDataHistory] = useState<History[]>([]);
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
  const [oFilteredProduct, setFilteredProduct] = useState<Product[]>([]);
  // เช็ค user login
  useAuth();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker [ลงทะเบียนแล้ว]"))
        .catch((err) => console.log("Service Worker registration failed:", err));
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

        setRefSeq(crypto.randomUUID());

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
            FTRefSeq: item.FTRefSeq
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
            FDCreateOn: item.FDCreateOn
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
    setType(ptType);
    setIsRepeat(true);
  };

  const C_PRCxRepeatSelect = async (option: string) => {
    try {
      if (option === "webService") {
        await C_PRCxUploadeWebServices();
        console.log("webService:", oProducts);
      } else if (option === "excel") {
        // await C_PRCxExportExcel();
        console.log("excel:", tRefDoc);
      }
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดการทำซ้ำ:", error);
    }

    // ปิด Modal หลังจากทำงานเสร็จ
    setIsRepeat(false);
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

  async function C_PRCxSaveDB() {
    try {
      console.log("✅ หา RefSeq ใหม่");
      const newRefSeq = crypto.randomUUID();
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
      await C_INSxHistoryToIndexedDB();

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
      alert("✅ บันทึกข้อมูลสำเร็จ");
    }
  };

  const C_INSxHistoryToIndexedDB = async () => {
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
      FNStatus: isNetworkOnline ? 1 : 1,
      FTRefSeq: tRefSeq
    };

    await C_INSxDataIndexedDB(oDb, tTaleName, [historyData]);
  };

  const C_INSxProductToIndexedDB = async () => {
    let tTaleName = "";
    let tDocKey = "";
    switch (tType) {
      case "Recieve":
        tTaleName = "TCNTProductReceive";
        tDocKey = "TCNTPdtTwiHD";
        break;
      case "Transfer":
        tTaleName = "TCNTProducyTransfer";
        tDocKey = "TCNTPdtTwxHD";
        break;
      case "Stock":
        tTaleName = "TCNTProducStock";
        tDocKey = "TCNTDocDTTmpAdj";
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
      FDCreateOn: C_SETxFormattedDate()
    }));
    await C_INSxDataIndexedDB(oDb, tTaleName, productData);
    setProducts([]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex p-4 justify-between items-center shadow-sm text-gray-500">
        <span className="text-l ml-auto">ชื่อผู้ใช้งาน : {oUserInfo?.FTUsrName} </span>
      </div>

      <div className="container mx-auto p-2 space-y-2">
        <h1 className="text-xl font-bold mb-4 text-gray-800">ประวัติการทำรายการล่าสุด</h1>
        <h2 className="text-m mb-2 text-gray-600">รับสินค้าจากผู้จำหน่าย</h2>
        {oReceiveDataHistory.length === 0 ? (
          <p className="text-center text-gray-500">ไม่มีประวัติการทำรายการ</p>
        ) : (
          oReceiveDataHistory.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-start border cursor-pointer"
              onClick={() => C_SETxViewHistoryProduct(data, "Recieve")} // ⬅️ ฟังก์ชันสำหรับคลิกที่ Card
            >
              {/* ซ้าย: เนื้อหา */}
              <div>
                <p className="text-base font-semibold text-gray-800">
                  เลขที่อ้างอิง <span className="text-sm text-gray-500 font-normal">#{data.FTRefDoc}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {data.FNStatus === 1 ? "อัพโหลดผ่าน Web Services สำเร็จ" : "อัพโหลดผ่าน Web Services ไม่สำเร็จ"}
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" /> {data.FTDate}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col items-end gap-2 h-full">
                {data.FNStatus === 1 ? (
                  <FaCheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FaExclamationCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="h-2"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    C_SETxViewRepeat(data, "Recieve");
                  }}
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1 mt-auto"
                >
                  <FaSyncAlt className="w-4 h-4" /> ทำซ้ำ
                </button>
              </div>
            </div>
          ))
        )}
      </div>


      <div className="container mx-auto p-2 space-y-2">
        <h2 className="text-m mb-2 text-gray-600">รับ / โอนสินค้าระหว่างสาขา</h2>
        {oTranferDataHistory.length === 0 ? (
          <p className="text-center text-gray-500">ไม่มีประวัติการทำรายการ</p>
        ) : (
          oTranferDataHistory.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-start border cursor-pointer"
              onClick={() => C_SETxViewHistoryProduct(data, "Transfer")} // ⬅️ ฟังก์ชันสำหรับคลิกที่ Card
            >
              {/* ซ้าย: เนื้อหา */}
              <div>
                <p className="text-base font-semibold text-gray-800">
                  เลขที่อ้างอิง <span className="text-sm text-gray-500 font-normal">#{data.FTRefDoc}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {data.FNStatus === 1 ? "อัพโหลดผ่าน Web Services สำเร็จ" : "อัพโหลดผ่าน Web Services ไม่สำเร็จ"}
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" /> {data.FTDate}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col items-end gap-2 h-full">
                {data.FNStatus === 1 ? (
                  <FaCheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FaExclamationCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="h-2"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    C_SETxViewRepeat(data, "Transfer");
                  }}
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1 mt-auto"
                >
                  <FaSyncAlt className="w-4 h-4" /> ทำซ้ำ
                </button>
              </div>
            </div>
          ))
        )}
      </div>


      <div className="container mx-auto p-2 space-y-2">
        <h2 className="text-m mb-2 text-gray-600">ตรวจนับสต็อก</h2>
        {oStockDataHistory.length === 0 ? (
          <p className="text-center text-gray-500">ไม่มีประวัติการทำรายการ</p>
        ) : (
          oStockDataHistory.map((data, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-start border cursor-pointer"
              onClick={() => C_SETxViewHistoryProduct(data, "Stock")} // ⬅️ ฟังก์ชันสำหรับคลิกที่ Card
            >
              {/* ซ้าย: เนื้อหา */}
              <div>
                <p className="text-base font-semibold text-gray-800">
                  เลขที่อ้างอิง <span className="text-sm text-gray-500 font-normal">#{data.FTRefDoc}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {data.FNStatus === 1 ? "อัพโหลดผ่าน Web Services สำเร็จ" : "อัพโหลดผ่าน Web Services ไม่สำเร็จ"}
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <FaRegCalendar className="w-4 h-4 text-gray-400" /> {data.FTDate}
                </p>
              </div>

              {/* ขวา: สถานะ + ปุ่ม */}
              <div className="flex flex-col items-end gap-2 h-full">
                {data.FNStatus === 1 ? (
                  <FaCheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FaExclamationCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="h-2"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    C_SETxViewRepeat(data, "Stock");
                  }}
                  className="text-blue-600 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1 mt-auto"
                >
                  <FaSyncAlt className="w-4 h-4" /> ทำซ้ำ
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="h-16"></div>

      {/* ข้อมูลประวัติสินค้า */}
      <ProductReceiveModal
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        oDataProduct={oFilteredProduct || []}
        tDate={tHistoryDate}
        tRefDoc={tHistoryRefDoc}
      />

      {/* Repeat */}
      <RepeatModal
        isOpen={isRepeat}
        onClose={() => setIsRepeat(false)}
        onOptionSelect={C_PRCxRepeatSelect}
      />

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

    </div>

  );
}
