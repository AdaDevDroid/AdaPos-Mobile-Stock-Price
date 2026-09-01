import React from "react";
import { History } from "@/models/models";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    oDataHistory: History[];
    onView: (history: History) => void;
    onRepeat: (history: History) => void;
    tRefDocLabel?: string;
    showRefDocType?: boolean;
}

const C_GETtRefDocTypeLabel = (ptDocType?: History["FTXthDocType"]) => {
    if (ptDocType === "1") return "ใบจ่ายโอน";
    if (ptDocType === "2") return "ใบขอโอน";
    return "ไม่ระบุประเภท";
};

const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    oDataHistory,
    onView,
    onRepeat,
    tRefDocLabel = "เลขที่อ้างอิง",
    showRefDocType = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="flex max-h-[90vh] w-[95%] flex-col overflow-hidden rounded-lg bg-white shadow-lg md:w-[90%]">
                {/* หัวข้อ Modal */}
                <div className="flex justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">ประวัติการทำรายการ</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                {/* ตารางประวัติการทำรายการ */}
                <div className="min-h-0 overflow-auto p-2 sm:p-4">
                    <table className={`w-full border-collapse mt-2 sm:mt-4 rounded-lg overflow-hidden ${showRefDocType ? "min-w-[760px]" : "min-w-[640px]"}`}>
                        <thead>
                            <tr className="bg-gray-100 border text-m text-[14px]">
                                <th className="p-2 whitespace-nowrap">วันที่</th>
                                <th className="p-2 whitespace-nowrap">{tRefDocLabel}</th>
                                {showRefDocType && <th className="p-2 whitespace-nowrap">ประเภทเอกสาร</th>}
                                <th className="p-2 whitespace-nowrap">สถานะ</th>
                                <th className="p-2 whitespace-nowrap">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {oDataHistory.map((data, index) => (
                                <tr key={index} className="border text-center text-gray-500 text-[14px]">
                                    <td className="p-2 whitespace-nowrap">{data.FTDate}</td>
                                    <td className="p-2 whitespace-nowrap">{data.FTRefDoc || "-"}</td>
                                    {showRefDocType && <td className="p-2 whitespace-nowrap">{C_GETtRefDocTypeLabel(data.FTXthDocType)}</td>}
                                    <td className="p-2 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-lg ${data.FNStatus !== 0
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            {data.FNStatus !== 0 ? "บันทึกแล้ว" : "ยกเลิก"}
                                        </span>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <button onClick={() => onView(data)} className="text-blue-500 hover:underline">
                                            ดูข้อมูล
                                        </button>{" "}
                                        |{" "}
                                        <button onClick={() => onRepeat(data)} className="text-blue-500 hover:underline">
                                            ทำซ้ำ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
