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
  exclusiveValue?: number;
};

export default function MultiSelect({
  className = "relative w-64",
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  exclusiveValue,
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
      ? value.filter((v) => v !== val)
      : val === exclusiveValue
        ? [val]
        : [...value.filter((v) => v !== exclusiveValue), val];

    onChange(newValue);
  };

  return (
    <div className={className} ref={ref}>
      {/* 선택된 값 표시 */}
      <div
        className={`flex cursor-pointer items-center justify-between rounded-[14px] border border-[#e5e8eb] bg-white px-4 py-3.5 text-[16px] active:scale-[0.99] transition-transform ${
          value.length > 0 ? "text-[#191f28]" : "text-[#8b95a1]"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {value.length > 0 ? value.join(", ") : placeholder}
        </span>
        <span className={`ml-2 shrink-0 text-[#8b95a1] transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </div>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[14px] border border-[#e5e8eb] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2.5 px-4 py-3 text-[15px] ${
                  checked ? "bg-[#e8f3ff] text-[#3182f6] font-semibold" : "text-[#4e5968]"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#3182f6]"
                  checked={checked}
                  onChange={() => toggleOption(opt.value)}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}

    </div>
  );
}
