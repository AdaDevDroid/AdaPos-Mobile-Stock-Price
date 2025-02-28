"use client";

import InputWithButton from "@/components/InputWithButton";
import InputWithLabel from "@/components/InputWithLabel";
import InputWithLabelAndButton from "@/components/InputWithLabelAndButton";
import { useState } from "react";
import { FaPlus, FaTrash, FaRegCalendar, FaEllipsisV, FaFileAlt, FaDownload, FaHistory, FaCamera } from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";

interface Product {
  id: number;
  barcode: string;
  cost: number;
  quantity: number;
}

export default function ReceiveGoods() {
  const [refDoc, setRefDoc] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [searchText, setSearchText] = useState<string>(""); // string

  const addProduct = () => {
    if (!barcode || !cost || !quantity) return;
    const newProduct = {
      id: products.length + 1,
      barcode,
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
    };
    setProducts([...products, newProduct]);
    setBarcode("");
    setCost("");
    setQuantity("1");
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  return (
    <div className="p-4 ms-1 mx-auto bg-white">

      <div className="flex flex-col md:flex-row items-start md:items-center pb-6">

        <div className="flex flex-row w-full py-2">
          {/* หัวข้อ */}
          <h1 className="text-2xl font-bold md:pb-0">รับสินค้าจากผู้จำหน่าย</h1>

          {/* ปุ่ม 3 จุด จอเล็ก */}
          <button
            className="md:hidden ml-2 p-2 rounded-md ml-auto text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>
        {/* ค้นหา PO และปุ่ม 3 จุด (สำหรับ desktop) */}
        <div className="flex w-full md:w-80 md:ml-auto pt-2 relative">
          <InputWithButton
            type="text"
            value={searchText}
            onChange={setSearchText}
            placeholder="ค้นหาใบ PO"
            icon={<GrDocumentText />}
            onClick={() => alert(`ข้อความ: ${searchText}`)}
          />
          {/* ปุ่ม 3 จุด */}
          <button
            className="hidden md:block ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 text-[18px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaEllipsisV />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-4 top-6 mt-12 bg-white border shadow-lg rounded-md w-auto text-[16px]">
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => alert(`ข้อความ: อัพโหลดผ่าน Web Services`)}
            >
              <FaFileAlt className="mr-2 text-gray-700" /> อัพโหลดผ่าน Web Services2
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => alert(`ข้อความ: ส่งออกเป็น File Excel`)}
            >
              <FaDownload className="mr-2 text-gray-700" /> ส่งออกเป็น File Excel
            </button>
            <button
              className="flex items-center w-full px-6 py-2 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => alert(`ข้อความ: ประวัติการทำรายการ`)}
            >
              <FaHistory className="mr-2 text-gray-700" /> ประวัติการทำรายการ
            </button>
          </div>
        )}
      </div>

      {/* กรอกข้อมูล */}
      <div className="space-y-4 pt-4">

        <InputWithLabel
          type="text"
          label={"เลขที่อ้างอิง"}
          icon={<FaRegCalendar />}
          value={refDoc}
          onChange={setRefDoc}
          placeholder="ระบุเลขที่อ้างอิงจาก Supplier"
        />

        <InputWithLabelAndButton
          type="text"
          label={"บาร์โค้ด"}
          value={barcode}
          onChange={setBarcode}
          icon={<FaCamera />}
          placeholder="สแกนหรือป้อนบาร์โค้ด"
          onClick={() => alert(`เพิ่มจำนวน: เปิดกล้อง`)}
        />

        <InputWithLabel
          type="number"
          label={"ต้นทุน"}
          value={cost}
          onChange={setCost}
          placeholder="ระบุต้นทุน (ถ้ามี)"
        />

        <InputWithLabelAndButton
          type="number"
          value={quantity}
          onChange={setQuantity}
          label={"จำนวนที่ได้รับ"}
          icon={<FaPlus />}
          onClick={addProduct}
        />
      </div>

      {/* ตารางสินค้า */}
      <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 border text-m text-[14px]">
            <th className="p-2">ลำดับ</th>
            <th className="p-2">บาร์โค้ด</th>
            <th className="p-2">ต้นทุน</th>
            <th className="p-2">จำนวน</th>
            <th className="p-2">จัดการ</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {products.map((product) => (
            <tr key={product.id} className="border text-center text-gray-500 text-[14px]">
              <td className="p-2">{product.id}</td>
              <td className="p-2">{product.barcode}</td>
              <td className="p-2">฿{product.cost.toFixed(2)}</td>
              <td className="p-2">{product.quantity}</td>
              <td className="p-2">
                <button onClick={() => removeProduct(product.id)} className="text-red-500">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col md:flex-row items-start md:items-center mt-4 ">
        {/* จำนวนรายการ */}
        <p className="text-gray-500 text-[14px]">จำนวนรายการ: {products.length} รายการ</p>

        <div className="flex w-full md:w-auto md:ml-auto pt-2 relative">
          <label className="flex items-center text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setChecked(!checked)}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-[14px]">บันทึกอัตโนมัติหลังสแกนบาร์โค้ด</span>
          </label>
        </div>
      </div>
    </div>
  );
}
