export const C_PRCxOpenIndexedDB = async () => {
  const DB_NAME = "AdaDB";
  const DB_VERSION = 3;

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 🔹 สร้างตาราง TCNTHistoryReceive ถ้ายังไม่มี
      if (!db.objectStoreNames.contains("TCNTHistoryReceive")) {
        const store = db.createObjectStore("TCNTHistoryReceive", { keyPath: "FTRefDoc", autoIncrement: true });
        store.createIndex("FTDate", "FTDate", { unique: false });
        store.createIndex("FTRefDoc", "FTRefDoc", { unique: false });
        store.createIndex("FNStatus", "FNStatus", { unique: false });
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
        console.log("✅ สร้างตาราง 'TCNTProductReceive' สำเร็จ");
      }
    };

    request.onsuccess = () => {
      console.log("✅ เชื่อมต่อ IndexedDB สำเร็จ");
      resolve(request.result);
    };

    request.onerror = () => {
      console.error("❌ เกิดข้อผิดพลาดในการเปิดฐานข้อมูล", request.error);
      reject(request.error);
    };
  });
};

export const C_DELxLimitData = async (oDb: IDBDatabase, pnLimitData: number, ptHistoryName: string, ptDataList: string): Promise<void> => {

  const deletedRefDocs = await cleanupHistoryData(oDb!!, ptHistoryName, pnLimitData);
  if (deletedRefDocs.length > 0) {
    await deleteProductsByRefDocs(oDb!!, deletedRefDocs, ptDataList);
  }

}

const cleanupHistoryData = async (oDb: IDBDatabase, ptTableName: string, pnLimitData: number): Promise<string[]> => {
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
          const deletedRef = cursor.value.FTRefDoc;
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
        console.error(`❌ ไม่สามารถดึงข้อมูลจาก ${storeName}`);
        reject([]);
      };
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการลบข้อมูล:", error);
      reject([]);
    }
  });
};

const deleteProductsByRefDocs = async (oDb: IDBDatabase, refDocs: string[], ptTableName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const storeName = ptTableName;
    const transaction = oDb.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    let deletedCount = 0;

    refDocs.forEach((refDoc) => {
      const index = store.index("FTRefDoc");
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
        console.error(`❌ ไม่สามารถลบข้อมูลจาก ${storeName} ที่ FTRefDoc = ${refDoc}`);
      };
    });

    transaction.oncomplete = () => {
      console.log(`✅ ลบข้อมูล ${deletedCount} รายการจาก ${storeName} สำเร็จ`);
      resolve();
    };

    transaction.onerror = () => {
      console.error(`❌ ลบข้อมูลจาก ${storeName} ล้มเหลว`);
      reject();
    };
  });
};

const C_GETxCountFromdDB = async (oDB: IDBDatabase, storeName: string): Promise<number> => {
  return new Promise((resolve) => {

    const transaction = oDB.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.count(); // ใช้ count() เพื่อนับจำนวนข้อมูลทั้งหมด

    request.onsuccess = () => {
      resolve(request.result); // คืนค่าจำนวนข้อมูล
    };

    request.onerror = () => {
      console.error("❌ ไม่สามารถดึงจำนวนข้อมูลจาก IndexedDB ได้");
      resolve(0);
    };
  });
};