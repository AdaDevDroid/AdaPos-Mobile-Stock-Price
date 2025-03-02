"use client";

import { ReactNode, Dispatch, SetStateAction } from "react";

interface InputWithButtonProps<T> {
  type?: "text" | "number";
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
  icon: ReactNode;
  onClick?: () => void;
  placeholder?: string;
}

export default function InputWithButton<T extends string | number>({
  type = "text",
  value,
  onChange,
  icon,
  onClick,
  placeholder = "",
}: InputWithButtonProps<T>) {
  return (
    <div className="flex flex-row items-center w-full">
        
      {/* Input */}
      <div className="flex items-center border rounded-l-md overflow-hidden flex-grow h-10">
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(type === "number" ? (Number(e.target.value) as T) : (e.target.value as T))
          }
          placeholder={type === "text" ? placeholder : ""}
          className="w-full px-4 outline-none h-full"
        />
      </div>
            {/* test */}
      {/* ปุ่ม */}
      <button
        className="bg-blue-600 text-white px-4 flex items-center justify-center h-10 rounded-r-md"
        onClick={onClick}
      >
        {icon}
      </button>
    </div>
  );
}