import { History, Product, UserInfo, SysConfig } from "@/models/models"

export const C_PRCxOpenIndexedDB = async () => {
  const DB_NAME = "AdaDB";
  const DB_VERSION = 17;

  const shouldResetDB = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME);

      request.onsuccess = () => {
        const db = request.result;
        const currentVersion = db.version;
        db.close();
        resolve(currentVersion !== DB_VERSION);
      };

      request.onerror = () => {
        resolve(false); // ไม่สามารถเปิด DB ได้ — ไม่ต้องลบ
      };

      request.onupgradeneeded = () => {
        // ยังไม่เคยเปิดมาก่อน ถือว่าไม่ต้องลบ
        resolve(false);
      };
    });
  };

  const needReset = await shouldResetDB();

  if (needReset) {
    console.log("⚠️ ตรวจพบการเปลี่ยนแปลงเวอร์ชัน — กำลังลบ DB เดิม...");
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => {
        console.log("🗑️ ลบฐานข้อมูลเดิมเรียบร้อย");
        try {
          if (localStorage.getItem("session_token")) {
            localStorage.removeItem("session_token");
            localStorage.removeItem("session_expiry");
            localStorage.removeItem("sidebarOpen");
          };
          console.log("✅ Logout ผ่าน API สำเร็จ");
        } catch (error) {
          console.log("❌ ไม่สามารถ Logout:", error);
        }
        resolve();
      };
      deleteRequest.onerror = () => {
        console.error("❌ ลบฐานข้อมูลไม่สำเร็จ", deleteRequest.error);
        reject(deleteRequest.error);
      };
    });
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 🔹 สร้างตาราง TCNTUserTmp ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTUserTmp")) {
        const store = db.createObjectStore("TCNTUserTmp", { autoIncrement: true });
        store.createIndex("FTUsrCode", "FTUsrCode", { unique: false });
        store.createIndex("FTUsrLogin", "FTUsrLogin", { unique: false });
        store.createIndex("FTUsrPass", "FTUsrPass", { unique: false });
        store.createIndex("FTUsrName", "FTUsrName", { unique: false });
        store.createIndex("FTBchCode", "FTBchCode", { unique: false });
        store.createIndex("FTBchName", "FTBchName", { unique: false });
        store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
        store.createIndex("FTAgnName", "FTAgnName", { unique: false });
        store.createIndex("FTMerCode", "FTMerCode", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTUserTmp' สำเร็จ");
      }
      //TsysConfig
      //limitdata, จุดทศนิยมแสดง, จุดทศนิยมบันทึก
      if (!db.objectStoreNames.contains("TsysConfig")) {
        const store = db.createObjectStore("TsysConfig", { autoIncrement: true });
        store.createIndex("FTSysCode", "FTSysCode", { unique: false });
        store.createIndex("FTSysStaUsrValue", "FTSysStaUsrValue", { unique: false });
        console.log("✅ สร้างตาราง 'TsysConfig' สำเร็จ");
      }

      // 🔹 สร้างตาราง TCNTHistoryReceive ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTHistoryReceive")) {
        const store = db.createObjectStore("TCNTHistoryReceive", { autoIncrement: true });
        store.createIndex("FTDate", "FTDate", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FNStatus", "FNStatus", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });

        console.log("✅ สร้างตาราง 'TCNTHistoryReceive' สำเร็จ");
      }

      // 🔹 สร้างตาราง TCNTProductReceive ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTProductReceive")) {
        const store = db.createObjectStore("TCNTProductReceive", { autoIncrement: true });
        store.createIndex("FNId", "FNId", { unique: false });
        store.createIndex("FTBarcode", "FTBarcode", { unique: false });
        store.createIndex("FCCost", "FCCost", { unique: false });
        store.createIndex("FNQuantity", "FNQuantity", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        store.createIndex("FTXthDocKey", "FTXthDocKey", { unique: false });
        store.createIndex("FTBchCode", "FTBchCode", { unique: false });
        store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
        store.createIndex("FTUsrName", "FTUsrName", { unique: false });
        store.createIndex("FDCreateOn", "FDCreateOn", { unique: false });
        store.createIndex("FTPORef", "FTPORef", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTProductReceive' สำเร็จ");
      }
     // 🔹 สร้างตาราง TCNTProductReceiveTmp ถ้ายังไม่มี
     if (!db.objectStoreNames.contains("TCNTProductReceiveTmp")) {
      const store = db.createObjectStore("TCNTProductReceiveTmp", { autoIncrement: true });
      store.createIndex("FNId", "FNId", { unique: false });
      store.createIndex("FTBarcode", "FTBarcode", { unique: false });
      store.createIndex("FCCost", "FCCost", { unique: false });
      store.createIndex("FNQuantity", "FNQuantity", { unique: false });
      store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
      store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
      store.createIndex("FTXthDocKey", "FTXthDocKey", { unique: false });
      store.createIndex("FTBchCode", "FTBchCode", { unique: false });
      store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
      store.createIndex("FTUsrName", "FTUsrName", { unique: false });
      store.createIndex("FDCreateOn", "FDCreateOn", { unique: false });
      console.log("✅ สร้างตาราง 'TCNTProductReceiveTmp' สำเร็จ");
    }

      

      // 🔹 สร้างตาราง TCNTHistoryTransfer ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTHistoryTransfer")) {
        const store = db.createObjectStore("TCNTHistoryTransfer", { autoIncrement: true });
        store.createIndex("FTDate", "FTDate", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FNStatus", "FNStatus", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTHistoryReceive' สำเร็จ");
      }

      // 🔹 สร้างตาราง TCNTProductTransfer ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTProductTransfer")) {
        const store = db.createObjectStore("TCNTProductTransfer", { autoIncrement: true });
        store.createIndex("FNId", "FNId", { unique: false });
        store.createIndex("FTBarcode", "FTBarcode", { unique: false });
        store.createIndex("FCCost", "FCCost", { unique: false });
        store.createIndex("FNQuantity", "FNQuantity", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        store.createIndex("FTXthDocKey", "FTXthDocKey", { unique: false });
        store.createIndex("FTBchCode", "FTBchCode", { unique: false });
        store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
        store.createIndex("FTUsrName", "FTUsrName", { unique: false });
        store.createIndex("FDCreateOn", "FDCreateOn", { unique: false });
        store.createIndex("FTPORef", "FTPORef", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTProductTransfer' สำเร็จ");
      }
   // 🔹 สร้างตาราง TCNTProductTransferTmp ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTProductTransferTmp")) {
        const store = db.createObjectStore("TCNTProductTransferTmp", { autoIncrement: true });
        store.createIndex("FNId", "FNId", { unique: false });
        store.createIndex("FTBarcode", "FTBarcode", { unique: false });
        store.createIndex("FCCost", "FCCost", { unique: false });
        store.createIndex("FNQuantity", "FNQuantity", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        store.createIndex("FTXthDocKey", "FTXthDocKey", { unique: false });
        store.createIndex("FTBchCode", "FTBchCode", { unique: false });
        store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
        store.createIndex("FTUsrName", "FTUsrName", { unique: false });
        store.createIndex("FDCreateOn", "FDCreateOn", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTProductTransferTmp' สำเร็จ");
      }

      // 🔹 สร้างตาราง TCNTHistoryStock ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTHistoryStock")) {
        const store = db.createObjectStore("TCNTHistoryStock", { autoIncrement: true });
        store.createIndex("FTDate", "FTDate", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FNStatus", "FNStatus", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTHistoryReceive' สำเร็จ");
      }

      // 🔹 สร้างตาราง TCNTProductStock ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTProductStock")) {
        const store = db.createObjectStore("TCNTProductStock", { autoIncrement: true });
        store.createIndex("FNId", "FNId", { unique: false });
        store.createIndex("FTBarcode", "FTBarcode", { unique: false });
        store.createIndex("FNQuantity", "FNQuantity", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        store.createIndex("FTXthDocKey", "FTXthDocKey", { unique: false });
        store.createIndex("FTBchCode", "FTBchCode", { unique: false });
        store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
        store.createIndex("FTUsrName", "FTUsrName", { unique: false });
        store.createIndex("FDCreateOn", "FDCreateOn", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTProductStock' สำเร็จ");
      }
        // 🔹 สร้างตาราง TCNTProductStockTmp ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTProductStockTmp")) {
        const store = db.createObjectStore("TCNTProductStockTmp", { autoIncrement: true });
        store.createIndex("FNId", "FNId", { unique: false });
        store.createIndex("FTBarcode", "FTBarcode", { unique: false });
        store.createIndex("FNQuantity", "FNQuantity", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FTRefSeq", "FTRefSeq", { unique: false });
        store.createIndex("FTXthDocKey", "FTXthDocKey", { unique: false });
        store.createIndex("FTBchCode", "FTBchCode", { unique: false });
        store.createIndex("FTAgnCode", "FTAgnCode", { unique: false });
        store.createIndex("FTUsrName", "FTUsrName", { unique: false });
        store.createIndex("FDCreateOn", "FDCreateOn", { unique: false });
        console.log("✅ สร้างตาราง 'TCNTProductStockTmp' สำเร็จ");
      }

    };

    request.onsuccess = () => {
      console.log("✅ เชื่อมต่อ IndexedDB สำเร็จ");
      resolve(request.result);
    };

    request.onerror = () => {
      console.log("❌ เกิดข้อผิดพลาดในการเปิดฐานข้อมูล", request.error);
      reject(request.error);
    };
  });
};

export const C_DELxLimitData = async (oDb: IDBDatabase, ptHistoryName: string, ptDataList: string): Promise<void> => {
  let nLimitData = 5

  const dataConfig = await C_GETxConfig(oDb);
        if (dataConfig) {
          dataConfig.forEach((config) => {
            if (config.FTSysCode === "nVB_LimitTmp") {
              const limitValue = parseInt(config.FTSysStaUsrValue, 10);
              if (!isNaN(limitValue)) {
                nLimitData = limitValue;
              } else {
                nLimitData = 5;
              }
            }
          });
        }

  console.log("Limit Data: ",nLimitData)

  const deletedRefDocs = await C_DELxHistoryData(oDb!!, ptHistoryName, nLimitData);
  if (deletedRefDocs.length > 0) {
    console.log("รายการที่จะลบ", deletedRefDocs);
    await C_DELxProductsByRefDocs(oDb!!, deletedRefDocs, ptDataList);
  }
}

export const C_DELoDataTmp = async (oDb: IDBDatabase, storeName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = oDb.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      alert("✅ ลบข้อมูลในตาราง 'Tmp' สำเร็จ");
      console.log("✅ ลบข้อมูลในตาราง 'Tmp' สำเร็จ");
      resolve();
    };

    clearRequest.onerror = (event) => {
      alert("❌ ไม่สามารถลบข้อมูลในตาราง 'TCNTProductReceiveTmp' ได้" + event);
      console.log("❌ ไม่สามารถลบข้อมูลในตาราง 'TCNTProductReceiveTmp' ได้", event);
      reject(event);
    };
  });
};

export const C_DELxProductTmpByFNId = async (oDb: IDBDatabase, fnId: number, storeName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = oDb.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const index = store.index("FNId");
    const request = index.openCursor(IDBKeyRange.only(fnId));

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.log(`✅ ลบข้อมูล ${deletedCount} รายการจาก 'TCNTProductReceiveTmp' ที่ FNId = ${fnId} สำเร็จ`);
        resolve();
      }
    };

    request.onerror = () => {
      console.log(`❌ ไม่สามารถลบข้อมูลจาก 'TCNTProductReceiveTmp' ที่ FNId = ${fnId}`);
      reject();
    };
  });
};

export const C_GETxUserData = async (oDb: IDBDatabase): Promise<UserInfo | null> => {
  return new Promise((resolve, reject) => {
    try {
      // 🔹 เปิด transaction แบบ readonly
      const transaction = oDb.transaction("TCNTUserTmp", "readonly");
      const store = transaction.objectStore("TCNTUserTmp");
      const request = store.getAll();

      request.onsuccess = () => {
        if (request.result.length > 0) {
          const userData = request.result[0]; // เอาข้อมูล user ตัวแรก
          const userInfo: UserInfo = {
            FTUsrCode: userData.FTUsrCode,
            FTUsrLogin: userData.FTUsrLogin,
            FTUsrLoginPwd: userData.FTUsrLoginPwd,
            FTUsrName: userData.FTUsrName,
            FTBchCode: userData.FTBchCode,
            FTBchName: userData.FTBchName,
            FTAgnCode: userData.FTAgnCode,
            FTAgnName: userData.FTAgnName,
            FTMerCode: userData.FTMerCode,
          };
          resolve(userInfo);
        } else {
          console.warn("⚠️ ไม่พบข้อมูลผู้ใช้ใน IndexedDB");
          resolve(null);
        }
      };

      request.onerror = () => {
        console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB");
        reject(null);
      };
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
      reject(null);
    }
  });
};

export const C_GETxConfig = async (oDb: IDBDatabase): Promise<SysConfig[] | null> => {
  return new Promise((resolve, reject) => {
    try {
      // 🔹 เปิด transaction แบบ readonly
      const transaction = oDb.transaction("TsysConfig", "readonly");
      const store = transaction.objectStore("TsysConfig");
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result; // ได้ข้อมูลเป็น array

        if (result.length > 0) {
          const configData: SysConfig[] = result.map((item) => ({
            FTSysCode: item.FTSysCode,
            FTSysStaUsrValue: item.FTSysStaUsrValue
          }));
          resolve(configData);
        } else {
          console.warn("⚠️ ไม่พบข้อมูลใน IndexedDB");
          resolve(null);
        }
      };

      request.onerror = () => {
        console.log("❌ ไม่สามารถดึงข้อมูลจาก IndexedDB");
        reject(null);
      };
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      reject(null);
    }
  });
};

export const C_INSxUserToDB = async (oDb: IDBDatabase, userData: UserInfo): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      reject(false);
      return;
    }

    const transaction = oDb.transaction("TCNTUserTmp", "readwrite");
    const store = transaction.objectStore("TCNTUserTmp");

    // ลบข้อมูลทั้งหมดในตาราง TCNTUserTmp
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      console.log("✅ ลบข้อมูลในตาราง 'TCNTUserTmp' สำเร็จ");

      // เพิ่มข้อมูลผู้ใช้ใหม่
      const addRequest = store.add(userData);

      addRequest.onsuccess = () => {
        console.log("✅ เพิ่มข้อมูลผู้ใช้สำเร็จ:", userData);
        resolve(true);
      };

      addRequest.onerror = (event) => {
        console.log("❌ ไม่สามารถเพิ่มข้อมูลผู้ใช้ได้", event);
        reject(false);
      };
    };

    clearRequest.onerror = (event) => {
      console.log("❌ ไม่สามารถลบข้อมูลในตาราง 'TCNTUserTmp' ได้", event);
      reject(false);
    };
  });
};

export const C_INSoSysConfigToDB = async (oDb: IDBDatabase, oSysConfig: SysConfig): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!oDb) {
      console.log("❌ Database is not initialized");
      reject(false);
      return;
    }

    const transaction = oDb.transaction("TsysConfig", "readwrite");
    const store = transaction.objectStore("TsysConfig");

    // เพิ่มข้อมูลผู้ใช้ใหม่
    const addRequest = store.add(oSysConfig);

    addRequest.onsuccess = () => {
      console.log("✅ เพิ่มข้อมูลผู้ใช้สำเร็จ:", oSysConfig);
      resolve(true);
    };

    addRequest.onerror = (event) => {
      console.log("❌ ไม่สามารถเพิ่มข้อมูลในตาราง 'TsysConfig' ได้", event);
      reject(false);
    };

  });
};

export const C_DELoSysConfigData = async (oDb: IDBDatabase): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = oDb.transaction("TsysConfig", "readwrite");
    const store = transaction.objectStore("TsysConfig");

    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      console.log("✅ ลบข้อมูลในตาราง 'TsysConfig' สำเร็จ");
      resolve();
    };

    clearRequest.onerror = (event) => {
      console.log("❌ ไม่สามารถลบข้อมูลในตาราง 'TsysConfig' ได้", event);
      reject(event);
    };
  });
};

export const C_INSxDataIndexedDB = async (oDb: IDBDatabase, storeName: string, data: (History | Product)[]) => {
  try {

    if (!oDb) {
      console.log("❌ Database is not initialized");
      return;
    }
    const transaction = oDb.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    data.forEach((item) => {
      const addRequest = store.add(item);
      addRequest.onerror = () => console.log(`❌ บันทึกไม่สำเร็จ`, addRequest.error);
    });

    transaction.oncomplete = () => {
      console.log(`✅ บันทึกข้อมูลสำเร็จใน '${storeName}'`);
    };

    transaction.onerror = () => {
      console.log("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล", transaction.error || "Unknown Error");
    };
  } catch (error) {
    console.log("❌ ข้อผิดพลาดในการใช้งาน IndexedDB", error);
  }
};

const C_DELxHistoryData = async (oDb: IDBDatabase, ptTableName: string, pnLimitData: number): Promise<string[]> => {
  return new Promise(async (resolve, reject) => {
    const storeName = ptTableName;
    const limitData = pnLimitData;
    const deletedRefDocs: string[] = [];

    try {
      const count = await C_GETxCountFromdDB(oDb, storeName);
      if (count <= limitData) {
        console.log("✅ ไม่ต้องลบข้อมูล (ข้อมูลยังไม่เกิน limit)");
        resolve([]);
        return;
      }

      console.log("✅ กำลังลบข้อมูลที่เกิน limit...");
      const transaction = oDb.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      let deleteCount = count - limitData;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && deleteCount > 0) {
          const deletedRef = cursor.value.FTRefSeq;
          deletedRefDocs.push(deletedRef);
          cursor.delete();
          deleteCount--;
          cursor.continue();
        } else {
          console.log(`✅ ลบข้อมูล ${deletedRefDocs.length} รายการจาก ${storeName} สำเร็จ`);
          resolve(deletedRefDocs);
        }
      };

      request.onerror = () => {
        console.log(`❌ ไม่สามารถดึงข้อมูลจาก ${storeName}`);
        reject([]);
      };
    } catch (error) {
      console.log("❌ เกิดข้อผิดพลาดในการลบข้อมูล:", error);
      reject([]);
    }
  });
};

const C_DELxProductsByRefDocs = async (oDb: IDBDatabase, refDocs: string[], ptTableName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const storeName = ptTableName;
    const transaction = oDb.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    let deletedCount = 0;

    refDocs.forEach((refDoc) => {
      const index = store.index("FTRefSeq");
      const request = index.openCursor(IDBKeyRange.only(refDoc));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      request.onerror = () => {
        console.log(`❌ ไม่สามารถลบข้อมูลจาก ${storeName} ที่ FTRefSeq = ${refDoc}`);
        console.log(`❌ ไม่สามารถลบข้อมูลจาก ${storeName} ที่ FTRefSeq = ${refDoc}`);
      };
    });

    transaction.oncomplete = () => {
      console.log(`✅ ลบข้อมูล ${deletedCount} รายการจาก ${storeName} สำเร็จ`);
      resolve();
    };

    transaction.onerror = () => {
      console.log(`❌ ลบข้อมูลจาก ${storeName} ล้มเหลว`);
      reject();
    };
  });
};

export const C_GETxCountFromdDB = async (oDB: IDBDatabase, storeName: string): Promise<number> => {
  return new Promise((resolve) => {

    const transaction = oDB.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.count(); // ใช้ count() เพื่อนับจำนวนข้อมูลทั้งหมด

    request.onsuccess = () => {
      resolve(request.result); // คืนค่าจำนวนข้อมูล
    };

    request.onerror = () => {
      console.log("❌ ไม่สามารถดึงจำนวนข้อมูลจาก IndexedDB ได้");
      resolve(0);
    };
  });
};