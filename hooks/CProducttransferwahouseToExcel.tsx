import * as XLSX from 'xlsx';


interface oData {
  tProductCode: string;
  tBarcode: string;
  tQTY: string;
}

const exportToExcel = (data: oData[]) => {

  const suggestionHeaderNote = [
    ["วิธีการกรอกข้อมูล"],
    [],
    ["ต้องระบุค่า (ห้ามซ้ำ) กรณีมีมากกว่า 1 คอลัม คิดรวมกันห้ามซ้ำ"],
    ["ต้องระบุค่า (ซ้ำได้)"],
    ["กรอกก็ได้ไม่กรอกก็ได้"],
    [],
    ["ข้อห้าม"],
    ["1. ห้าม เพิ่ม / สลับ คอลัม"],
    ["2. ห้ามตีกรอบเซลล์"],
    ["3. ห้ามมีอักขระพิเศษ"],
    ["    เช่น", "'", "Single Code", "แนะนำให้ใช้ Double code แทน"],
    ["          ", "\\", "Backslash", "แนะนำให้ใช้ slash แทน"],
    [],
  ];

  const formattedProducts = data.map((oProduct) => ({
    Barcode: oProduct.tBarcode,
    Quantity: parseFloat(oProduct.tQTY.toString()).toFixed(4), // แปลงเป็นทศนิยม 4 ตำแหน่ง
  }));
    const header1 = [["* Bar Code Text[25]", " * Qty  Decimal[18,4]  "]];
 const suggestionSheet = XLSX.utils.aoa_to_sheet(suggestionHeaderNote);

  

   
    // const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
   

    const worksheet1 = XLSX.utils.aoa_to_sheet(header1);
    XLSX.utils.sheet_add_json(worksheet1, formattedProducts, { origin: "A2", skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, suggestionSheet, "Suggestion");
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Transferbetweenbranch_lite");
  
    XLSX.writeFile(workbook, "Transferbetweenbranch.xlsx");
  };

export default exportToExcel;