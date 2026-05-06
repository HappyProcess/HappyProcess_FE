'use client'
import {getYearOptions, healthOptions, regionOptions} from "@/register/Options";
import { on } from "events";
import { useState } from "react";
import { ControllerRenderProps } from "react-hook-form";

type RegionKey = keyof typeof regionOptions;
export type RegionValue = {
  do: RegionKey | '';
  si: string;
};

type RegionProps ={
  className?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export default function RegionSelect({className, required=false, value, onChange}: RegionProps) {
  const [location, setLocation] = useState<RegionValue>({do: '', si: ''});
  
  const doList = Object.keys(regionOptions);
  const siList = location.do ? regionOptions[location.do] : [];

  return (
    <div className="flex gap-4">
      <select
        value={location.do} className={className} required={required}
        onChange={(e)=>{
          const newDo = e.target.value as RegionKey;
          setLocation({
            do: newDo,
            si: '' // 도가 변경되면 시는 초기화
          })
          onChange('')
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
        value={location.si} disabled={!location.do} className={className} required={required}
        onChange={(e) => {
          setLocation({
            ...location,
            si: e.target.value
          })
          onChange(e.target.value)
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