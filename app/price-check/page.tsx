"use client";
import React, { useState } from 'react';
import { Search, Tag, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/NetworkStatusContext";
import { C_PRCxOpenIndexedDB, C_GETxUserData } from "@/hooks/CIndexedDB";
import { CCameraScanner } from "@/hooks/CCameraScanner";
import { FiCamera, FiCameraOff } from "react-icons/fi";

interface Price {
  rtPdtCode: string;
  rtPghDocNo: string;
  rtPghDocType: string;
  rtPunCode: string;
  rcPrice: number;
  rtPplCode: string;
  rtPplName: string | null;
  rdPghDStart: string;
  rdPghDStop: string;
  rtPghTStart: string;
  rtPghTStop: string;
}

interface Promotion {
  rtBchCode: string;
  rtPmhDocNo: string;
  rtPdtCode: string;
  rtPunCode: string;
  rdPmhDStart: string;
  rdPmhTStart: string;
  rdPmhDStop: string;
  rdPmhTStop: string;
  rtPplCode: string;
  rtPmhName: string;
}

interface ProductData {
  rtPdtCode: string;
  rtPdtName: string;
  aoPdtBar: {
    rtPdtCode: string;
    ptBarCode: string;
    rtPunCode: string;
    rtPunName: string;
    rcUnitFact: number;
  }[];
  aoPdtStk: {
    rtPdtCode: string;
    rtBchCode: string;
    rtWahCode: string;
    rcStkQty: number;
    rtWahName: string;
  }[];
  aoPdtPmt: Promotion[];
  aoPdtPrice: Price[];
}

const PricePromotionCheck = () => {
  useAuth();

  const [searchType, setSearchType] = useState('barcode');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPromotions, setShowAllPromotions] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const isNetworkOnline = useNetworkStatus();

  const handleSearch = async () => {

    if (!isNetworkOnline) {
      setLoading(false);
      alert("❌ ข้อความ: Internet Offline");
      return;
    }

    setLoading(true);
    try {
      const responseCode = await fetch('/api/query/selectUrlPdtCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchType, searchQuery })
      });

      if (!responseCode.ok) {
        alert('ไม่พบข้อมูลสินค้า');
        throw new Error('Network response was not ok');
      }

      const dataCode = await responseCode.json();
      if (!dataCode.data || dataCode.data.length === 0) {
        throw new Error('No product code found');
      }

      const pdtCode = dataCode.data[0].FTPdtCode;

      // Get user data from IndexedDB
      const oDatabase = await C_PRCxOpenIndexedDB();
      const oUserData = await C_GETxUserData(oDatabase);

      if (!oUserData) {
        alert("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
        setLoading(false);
        return;
      }

      const pdtData = {
        ptAgnCode: '',
        ptBchCode: '',
        ptMerCode: '',
        ptShpCode: '',
        ptWahCode: '',
        ptPdtCode: pdtCode,
      };

      const response = await fetch('/api/call-promotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdtData)
      });

      if (!response.ok) {
        alert('ไม่พบข้อมูลสินค้า');
      }

      const data = await response.json();
      if (!data.roItem) {
        alert('ไม่พบข้อมูลสินค้า');
      }
      setProductData(data.roItem);
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { C_PRCxStartScanner, C_PRCxStopScanner, C_PRCxPauseScanner, bScanning, oScannerRef } = CCameraScanner(
    (ptDecodedText) => {
      C_PRCxPauseScanner();

      setSearchQuery(ptDecodedText);
      handleSearch();

      // ✅ รอ 500ms ก่อนเปิดกล้องใหม่
      setTimeout(() => {
        // C_PRCxResumeScanner();
        C_PRCxStopScanner();
      }, 500);
    }
  );

  return (
    <div className="p-4 ms-1 mx-auto bg-white" >
      <div className="flex flex-col items-start md:items-center pb-6">

        {/* Page Title */}
        <div className="flex flex-row w-full py-2">
          <h1 className="text-2xl font-bold md:pb-0">ตรวจสอบราคา/โปรโมชั่น</h1>
        </div>

        <div className="w-full">

          {/* Search Section */}
          <div className="bg-white rounded-lg mb-6">

            {/* ตัวสแกน QR Code พร้อมกรอบ */}
            <div
              id="reader"
              ref={oScannerRef}
              className={`my-4 relative flex items-center justify-center  md:w-[50%] w-[100%] mx-auto ${bScanning ? "h-[50%]" : "h-[0px] pointer-events-none"
                } transition-opacity duration-300`}
            >
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Type */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วิธีค้นหา
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="barcode">บาร์โค้ด</option>
                  <option value="name">ชื่อสินค้า</option>
                  <option value="product_code">รหัสสินค้า</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="md:col-span-2">

                {/* ส่วนหัวข้อค้นหา */}
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  ค้นหา
                </div>

                {/* ช่องค้นหาและปุ่ม */}
                <div className="flex">
                  <input
                    className="w-full px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === 'barcode'
                        ? 'สแกนหรือป้อนบาร์โค้ด'
                        : searchType === 'name'
                          ? 'ป้อนชื่อสินค้า'
                          : 'ป้อนรหัสสินค้า'
                    }
                  />

                  {/* ปุ่มกล้อง */}
                  <button
                    value={searchQuery}
                    onClick={bScanning ? C_PRCxStopScanner : C_PRCxStartScanner}
                    className="px-4 py-2 bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
                  >
                    <div className="flex items-center justify-center">
                      {bScanning ? <FiCameraOff className="w-6 h-6" /> : <FiCamera className="w-6 h-6" />}
                    </div>
                  </button>

                  <div className="w-[1px] bg-gray-300"></div>

                  {/* ปุ่มค้นหา */}
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg border-blue-500 hover:bg-blue-700"
                  >
                    <div className="flex items-center justify-center">
                      <Search className="w-6 h-6" />
                    </div>
                  </button>

                </div>

              </div>

            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
              <div className="loader"></div>
              <p className="ml-2">กำลังโหลด...</p>
            </div>
          )}

          {/* Product Details */}
          {productData && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Product Header */}
              <div className="p-4 border-b">
                <div className="flex flex-wrap md:flex-nowrap gap-4">

                  {/* Product Image */}
                  {/* <img
                    src='/api/placeholder/150/150'
                    alt={productData.rtPdtName}
                    className="w-32 h-32 object-cover rounded-lg"
                  /> */}

                  {/* Product Info */}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{productData.rtPdtName}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {productData.aoPdtBar && productData.aoPdtBar.length > 0 && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">บาร์โค้ด</p>
                            <p className="font-medium">{productData.aoPdtBar[0].ptBarCode}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">หน่วย</p>
                            <p className="font-medium">{productData.aoPdtBar[0].rtPunName}</p>
                          </div>
                        </>
                      )}
                      {productData.aoPdtStk && productData.aoPdtStk.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">สต็อก</p>
                          <p className="font-medium">{productData.aoPdtStk[0].rcStkQty} หน่วย</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Price */}
                  {productData.aoPdtPrice && productData.aoPdtPrice.length > 0 && (
                    <div className="text-center md:text-right">
                      <p className="text-sm text-gray-600">ราคาปัจจุบัน</p>
                      <p className="text-3xl font-bold text-blue-600">
                        ฿{productData.aoPdtPrice[0].rcPrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price List */}
              {productData.aoPdtPrice && productData.aoPdtPrice.length > 0 && (
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    ราคาตามประเภท
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {productData.aoPdtPrice.map((price: Price, index: number) => (
                      <div
                        key={index}
                        className="bg-white p-3 rounded-lg border"
                      >
                        <p className="text-sm text-gray-600">
                          {price.rtPghDocType === '1'
                            ? 'ราคาปกติ'
                            : price.rtPghDocType === '2'
                              ? 'ราคาพิเศษ'
                              : price.rtPghDocType === '5'
                                ? 'ราคาสมาชิก'
                                : price.rtPghDocType}
                        </p>
                        <p className="text-lg font-semibold">
                          ฿{price.rcPrice.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotions */}
              {productData.aoPdtPmt && productData.aoPdtPmt.length > 0 && (
                <div className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    โปรโมชั่นที่ใช้ได้
                  </h3>
                  <div className="space-y-4">
                    {productData.aoPdtPmt.slice(0, showAllPromotions ? undefined : 2).map((promo: Promotion, index: number) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{promo.rtPmhName}</h4>
                        </div>
                        <div className="mt-2 text-sm">
                          <p className="text-gray-500">
                            ระยะเวลา: {new Date(promo.rdPmhDStart).toLocaleDateString('th-TH')} - {new Date(promo.rdPmhDStop).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                    ))}

                    {productData.aoPdtPmt.length > 2 && (
                      <button
                        onClick={() => setShowAllPromotions(!showAllPromotions)}
                        className="w-full py-2 text-blue-600 hover:text-blue-800 flex items-center justify-center"
                      >
                        {showAllPromotions ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            แสดงน้อยลง
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            แสดงทั้งหมด ({productData.aoPdtPmt.length} รายการ)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PricePromotionCheck;