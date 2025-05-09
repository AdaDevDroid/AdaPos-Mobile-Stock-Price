import React from "react";
import { History } from "@/models/models";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    oDataHistory: History[];
    onView: (history: History) => void;
    onRepeat: (history: History) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, oDataHistory, onView, onRepeat }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-[90%] rounded-lg shadow-lg">
                {/* หัวข้อ Modal */}
                <div className="flex justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">ประวัติการทำรายการ</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                {/* ตารางประวัติการทำรายการ */}
                <div className="p-4">
                    <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-100 border text-m text-[14px]">
                                <th className="p-2">วันที่</th>
                                <th className="p-2">เลขที่อ้างอิง</th>
                                <th className="p-2">สถานะ</th>
                                <th className="p-2">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {oDataHistory.map((data, index) => (
                                <tr key={index} className="border text-center text-gray-500 text-[14px]">
                                    <td className="p-2">{data.FTDate}</td>
                                    <td className="p-2">{data.FTRefDoc}</td>
                                    <td className="p-2">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-lg ${data.FNStatus !== 0
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            {data.FNStatus !== 0 ? "บันทึกแล้ว" : "ยกเลิก"}
                                        </span>
                                    </td>
                                    <td className="p-2">
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