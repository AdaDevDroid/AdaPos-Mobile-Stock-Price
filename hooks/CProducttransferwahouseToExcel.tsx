import * as XLSX from 'xlsx';


interface oData {
  tProductCode: string;
  tBarcode: string;
  tQTY: string;
}

const exportToExcel = (data: oData[]) => {

  const formattedProducts = data.map((oProduct) => ({
    ProductCode: oProduct.tProductCode,
    Barcode: oProduct.tBarcode,
    Quantity: parseFloat(oProduct.tQTY.toString()).toFixed(4), // แปลงเป็นทศนิยม 4 ตำแหน่ง
  }));
    const header1 = [["* Product Code Text[20]", "* Bar Code Text[25]", " * Qty  Decimal[18,4]  "]];
    const emptySheet = XLSX.utils.aoa_to_sheet([[]]);

  

   
    // const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
   

    const worksheet1 = XLSX.utils.aoa_to_sheet(header1);
    XLSX.utils.sheet_add_json(worksheet1, formattedProducts, { origin: "A2", skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, emptySheet, "Suggestion");
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Transferbetweenbranch");
  
    XLSX.writeFile(workbook, "Producttransferwahouse.xlsx");
  };

export default exportToExcel;