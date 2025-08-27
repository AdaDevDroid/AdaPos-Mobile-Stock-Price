import ExcelJS from 'exceljs';

interface oData {
  tBarcode: string;
  tQTY: string;
  tCost: string;
}

const exportToExcel = async (data: oData[]) => {
  const workbook = new ExcelJS.Workbook();

  // Suggestion Sheet
  const suggestionSheet = workbook.addWorksheet('Suggestion');
  const suggestionData = [
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
  
  suggestionData.forEach((row, index) => {
    suggestionSheet.addRow(row);
  });

  // Purchase Invoice Sheet
  const worksheet = workbook.addWorksheet('Purchase Invoice');
  
  // Add header
  worksheet.addRow(["* Bar Code Text[25]", "* Qty  Decimal[18,4]", " * Price  Decimal[18,4]"]);
  
  // Add data
  data.forEach((oProduct) => {
    worksheet.addRow([
      oProduct.tBarcode,
      parseFloat(oProduct.tQTY.toString()).toFixed(4),
      parseFloat(oProduct.tCost.toString()).toFixed(4)
    ]);
  });

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'PurchaseInvoice.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
  };

export default exportToExcel;