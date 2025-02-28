import { Dispatch, ReactNode, SetStateAction } from "react";

interface InputWithLabelProps<T> {
  type?: "text" | "number";
  label: string;
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
  placeholder?: string;
  icon?: ReactNode;
}

export default function InputWithLabel<T extends string | number>({
  type,
  label,
  value,
  onChange,
  placeholder = "",
  icon,
}: InputWithLabelProps<T>) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-x-1">
        {icon && <span className="text-gray-500">{icon}</span>} {/* แสดง icon ถ้ามี */}
        <span className="text-[14px] text-gray-700">{label}</span>
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
            onChange(type === "number" ? (Number(e.target.value) as T) : (e.target.value as T))
          }
        className="border w-full px-4 py-2 rounded-md"
      />
    </div>
  );
}