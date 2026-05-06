'use client'
import {getYearOptions, healthOptions, regionOptions} from "@/register/Options";
import { useState } from "react";

type RegionKey = keyof typeof regionOptions;
export type RegionValue = {
  do: RegionKey | '';
  si: string;
};

type RegionProps ={
  className?: string;
  required?: boolean;
  value: RegionValue;
  onChange: (value: RegionValue) => void;
}

export default function RegionSelect({className, required=false, value, onChange}: RegionProps) {
  const doList = Object.keys(regionOptions);
  const siList = value.do ? regionOptions[value.do] : [];

  return (
    <div className="flex gap-4">
      <select
        value={value.do} className={className} required={required}
        onChange={(e)=>{
          const newDo = e.target.value as RegionKey;
          onChange({
            do: newDo,
            si: '' // 도가 변경되면 시는 초기화
          })
        }}
      >
        <option value="">도</option>
        {doList.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={value.si} disabled={!value.do} className={className} required={required}
        onChange={(e) => {
          onChange({
            ...value,
            si: e.target.value
          })
        }}
      >
        <option value="">시</option>
        {siList.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}