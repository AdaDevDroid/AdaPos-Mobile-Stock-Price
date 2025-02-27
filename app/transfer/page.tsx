"use client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function TransferPage() {
  // เช็ค user login
  // useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white p-4">
      <header className="flex justify-between items-center w-full ">
        <div className="text-xl font-bold">
          รับโอนสินค้าระหว่างสาขา
        </div>
        <div className="flex items-center space-x-4 ml-auto mr-4">
          <input
            type="text"
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="ค้นหาใบจ่ายโอน"
          />
          <button
            type="button"
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              ></path>
            </svg>
          </button>
        </div>
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            id="options-menu"
            aria-haspopup="true"
            aria-expanded="true"
            onClick={toggleDropdown}
          >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
   
          </button>
          {isOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              <div className="py-1" role="none">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  บันทึก รอนำเข้ารายการ
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  ส่งออกเป็น File Excel
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  ประวัติการทำรายการ
                </a>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-col space-y-4 mt-4 ">
        <div className="flex flex-col ">
          <label className="mb-2 font-medium text-gray-700">เลขที่อ้างอิงใบจ่ายโอน</label>
          <input
            type="text"
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="ระบุเลขที่อ้างอิงใบจ่ายโอน"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">บาร์โค้ด</label>
          <input
            type="text"
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="สแกนบาร์โค้ดหรือระบุเลขบาร์โค้ด"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">ต้นทุน</label>
          <input
            type="text"
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="ระบุต้นทุน (ถ้ามี)"
          />
        </div>
        
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">จำนวนที่รับ</label>
            <div className="flex">
              <input
                type="text"
                className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder=""
              />
              <button
                type="button"
                className="ml-2 p-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
      </div>

      <div className="flex flex-col mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ลำดับ
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            บาร์โค้ด
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ต้นทุน
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            จำนวน
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           จัดการ
          </th>
        </tr>
          </thead>
        </table>
      </div>

      
    </div>
  );
}