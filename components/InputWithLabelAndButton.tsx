"use client";

import { ReactNode, Dispatch, SetStateAction } from "react";

interface InputWithLabelAndButtonProps<T> {
    type?: "text" | "number";
    value: T;
    onChange: Dispatch<SetStateAction<T>>;
    label: string;
    icon: ReactNode;
    onClick?: () => void;
    placeholder?: string;
    inputRef?: React.Ref<HTMLInputElement>;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputMode?: "none" | "text" | "numeric" | "decimal" | "search";
    readOnly?: boolean;
}

export default function InputWithLabelAndButton<T extends string | number>({
    type = "text",
    value,
    onChange,
    label,
    icon,
    onClick,
    placeholder = "",
    inputRef,
    onKeyDown,
    inputMode = "text",
    readOnly = false,
}: InputWithLabelAndButtonProps<T>) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-x-1 ">
                {/* Label */}
                <span className="text-[14px] text-gray-700">{label}</span>
            </div>
            <div className="flex flex-row items-center w-full">
                {/* Input */}
                <div className="flex items-center border rounded-l-md overflow-hidden flex-grow h-10">
                    <input
                        ref={inputRef}
                        type={type}
                        value={value}
                        onChange={(e) => {
                            let value = e.target.value;
                        
                            if (type === "number") {
                                value = value.replace(/^0+(?=\d)/, "");
                                onChange(value as T); 
                            } else {
                                onChange(value as T);
                            }
                        }}
                        placeholder={type === "text" ? placeholder : ""}
                        className="w-full px-4 outline-none h-full"
                        onKeyDown={onKeyDown}
                        inputMode={inputMode}
                        readOnly={readOnly}
                    />
                </div>

                {/* ปุ่ม */}
                <button
                    className="bg-blue-600 text-white px-4 flex items-center justify-center h-10 rounded-r-md"
                    onClick={onClick}
                >
                    {icon}
                </button>
            </div>
        </div>
    );
}