import React from "react";
import { Product } from "@/models/models";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  oDataProduct: Product[];
  tDate: string;
  tRefDoc: string;
}

const ProductReceiveModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  oDataProduct,
  tDate,
  tRefDoc,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white md:w-[50%] w-[90%] rounded-lg shadow-lg max-h-[80vh] overflow-hidden">
        {/* หัวข้อ Modal */}
        <div className="flex justify-between p-4 border-b">
          <h2 className="text-lg font-bold">ประวัติการทำรายการ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* รายละเอียด */}
        <div className="flex flex-row justify-between w-full pt-4 px-4">
          <p className="text-gray-500 text-[14px]">วันที่: {tDate}</p>
          <p className="text-gray-500 text-[14px]">เลขที่อ้างอิง: {tRefDoc}</p>
        </div>

        {/* ตารางประวัติการทำรายการ */}
        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 border text-m text-[14px]">
                <th className="p-2">ลำดับ</th>
                <th className="p-2">บาร์โค้ด</th>
                <th className="p-2">ต้นทุน</th>
                <th className="p-2">จำนวน</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {oDataProduct.map((product, index) => (
                <tr key={index} className="border text-center text-gray-500 text-[14px]">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{product.FTBarcode}</td>
                  <td className="p-2">฿{product.FCCost.toFixed(2)}</td>
                  <td className="p-2">{product.FNQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductReceiveModal;