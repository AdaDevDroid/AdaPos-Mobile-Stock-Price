import * as XLSX from 'xlsx';


interface oData {
  tBarcode: string;
  tQTY: string;
  tCost: string;
}

const exportToExcel = (data: oData[]) => {

   // แปลงข้อมูลตัวเลขเป็นทศนิยม 4 ตำแหน่ง
   const formattedProducts = data.map((oProduct) => ({
    Barcode: oProduct.tBarcode,
    Quantity: parseFloat(oProduct.tQTY.toString()).toFixed(4), // แปลงเป็นทศนิยม 4 ตำแหน่ง
    Cost: parseFloat(oProduct.tCost.toString()).toFixed(4),   // แปลงเป็นทศนิยม 4 ตำแหน่ง
  }));
    const header1 = [["* Bar Code Text[25]", "* Qty  Decimal[18,4]", " * Price  Decimal[18,4]"]];
    const emptySheet = XLSX.utils.aoa_to_sheet([[]]);

  

   
    // const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
   

    const worksheet1 = XLSX.utils.aoa_to_sheet(header1);
    XLSX.utils.sheet_add_json(worksheet1, formattedProducts, { origin: "A2", skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, emptySheet, "Suggestion");
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Purchase Invoice");
  
    XLSX.writeFile(workbook, "PurcaseInvoice.xlsx");
  };

export default exportToExcel;