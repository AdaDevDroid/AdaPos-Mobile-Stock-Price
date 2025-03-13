import { FaDownload, FaFileAlt } from "react-icons/fa";


import React from "react";


interface RepeatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOptionSelect: (option: string) => void;
}

const RepeatModal: React.FC<RepeatModalProps> = ({isOpen, onClose, onOptionSelect}) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white w-[300px] p-4 rounded-lg shadow-lg text-center">
          {/* หัวข้อ Modal */}
          <div className="flex justify-between pb-2 border-b">
            <h2 className="text-lg">เลือกรายการทำซ้ำ</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
  
          <button
            className="w-full bg-blue-500 text-white py-2 rounded-md mb-2 hover:bg-blue-600 flex items-center justify-center"
            onClick={() => onOptionSelect("webService")}
          >
            <FaFileAlt className="mr-2 text-white text-lg" /> อัพโหลดผ่าน Web Services
          </button>
  
          <button
            className="w-full bg-blue-500 text-white py-2 rounded-md mb-2 hover:bg-blue-600 flex items-center justify-center"
            onClick={() => onOptionSelect("excel")}
          >
            <FaDownload className="mr-2 text-white text-lg" /> ส่งออกเป็น File Excel
          </button>
        </div>
      </div>
    );
  };

  export default RepeatModal;