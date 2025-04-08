import React from "react";
import { BranchInfo } from "@/models/models";

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  oData: BranchInfo[];
  onOptionSelect: (FTBchCode: string,FTBchName: string) => void;
}

const BrancheModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  oData,
  onOptionSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white md:w-[50%] w-[90%] rounded-lg shadow-lg max-h-[80vh] overflow-hidden">
        {/* หัวข้อ Modal */}
        <div className="flex justify-between p-4 border-b">
          <h2 className="text-lg font-bold">เลือกสาขา</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        {/* ตารางประวัติการทำรายการ */}
        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full border-collapse mt-4 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 border text-m text-[14px]">
                <th className="p-2">ลำดับ</th>
                <th className="p-2">รหัสสาขา</th>
                <th className="p-2">ชื่อสาขา</th>

              </tr>
            </thead>
            <tbody className="bg-white">
              {oData.map((user, index) => (
                <tr
                  key={index}
                  className="border text-center text-gray-500 text-[14px] hover:bg-green-200"
                  onClick={(e) => {
                  onOptionSelect(user.FTBchCode, user.FTBchName);
                  }}
                >
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{user.FTBchCode}</td>
                  <td className="p-2">{user.FTBchName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrancheModal;