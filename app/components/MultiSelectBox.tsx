"use client";

import { useEffect, useState, useRef } from "react";

type Option = {
  label: string;
  value: number;
};

type MultiSelectProps = {
  className?: string;
  options: Option[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
};

export default function MultiSelect({
  className = "relative w-64",
  options,
  value,
  onChange,
  placeholder = "선택하세요"
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: number) => {
    const newValue = value.includes(val)
      ? value.filter((v) => v !== val) : [...value, val];

    onChange(newValue);
  };

  return (
    <div className={className} ref={ref}>
      {/* 선택된 값 표시 */}
      <div
        className="border p-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length > 0 ? value.join(", ") : placeholder}
      </div>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute border w-full bg-white shadow">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 p-2 hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
      
    </div>
  );
}