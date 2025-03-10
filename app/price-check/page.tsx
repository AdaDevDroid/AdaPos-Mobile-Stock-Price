"use client";
import { useAuth } from "@/hooks/useAuth";

export default function PriceCheckPage() {
  // เช็ค user login
  useAuth();

  const data = {
    FTBchCode: 'B0004',
    FTXthDocNo: 'DOC123456',
    FNXtdSeqNo: 1,
    FTXthDocKey: 'DOC_KEY_004',
    FTXthDocType: 'A',
    FTXtdBarCode: '1234567890123',
    FCXtdQty: 10.0000,
    FCXtdQtyAll: 100.0000,
    FCXtdCostIn: 50.0000,
    FTLastUpdBy: 'admin',
    FTCreateBy: 'admin',
    FTAgnCode: 'AGN004'
  };
  
  fetch('/api/query/insert-docspdttmp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(response => response.json()).then(data => console.log(data)).catch(error => console.error('Error:', error));

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <h3 className="text-2xl mt-4">PriceCheckPage</h3>
        <p className="text-gray-500">เข้าสู่หน้า PriceCheckPage</p>
      </div>
    </div>
  );
}