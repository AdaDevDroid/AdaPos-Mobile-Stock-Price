import { Dispatch, ReactNode, SetStateAction } from "react";

interface InputWithLabelProps<T> {
  type?: "text" | "number";
  label: string;
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
  placeholder?: string;
  icon?: ReactNode;
  disabled?: boolean; // ✅ เพิ่ม props disabled
}

export default function InputWithLabel<T extends string | number>({
  type = "text",
  label,
  value,
  onChange,
  placeholder = "",
  icon,
  disabled = false, // ✅ ค่า default เป็น false
}: InputWithLabelProps<T>) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-x-1">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="text-[14px] text-gray-700">{label}</span>
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          if (!disabled) { // ✅ ป้องกันการเปลี่ยนค่าเมื่อ disabled
            let newValue = e.target.value;
            if (type === "number") {
              newValue = newValue.replace(/^0+(?=\d)/, "");
            }
            onChange(newValue as T);
          }
        }}
        disabled={disabled} // ✅ กำหนดค่า disabled
        className={`border w-full px-4 py-2 rounded-md ${
          disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
        }`} // ✅ เปลี่ยน UI เมื่อถูกปิดการใช้งาน
      />
    </div>
  );
}