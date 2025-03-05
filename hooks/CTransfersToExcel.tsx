import * as XLSX from 'xlsx';


interface oData {
  tBarcode: string;
  tCost: string;
  tQTY: string;
}

const exportToExcel = (data: oData[]) => {
    const header1 = [["*Bar Code Text[25]", "Cost[50]", " * Qty [18,4] "]];
    const emptySheet = XLSX.utils.aoa_to_sheet([[]]);

  

   
    // const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
   

    const worksheet1 = XLSX.utils.aoa_to_sheet(header1);
    XLSX.utils.sheet_add_json(worksheet1, data, { origin: "A2", skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, emptySheet, "Suggestion");
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Adjust Stock");
  
    XLSX.writeFile(workbook, "Transfers.xlsx");
  };

export default exportToExcel;