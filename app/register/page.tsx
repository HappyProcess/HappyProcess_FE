'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RegionSelect, MultiSelect} from "@/components";
import { getYearOptions, healthOptions, alarmOptions } from "./Options";
import { RegionValue } from "@/components/RegionSelectBoxes";

const options = ["사과", "바나나", "오렌지"];

export default function Register() {
  const [age, setAge] = useState('');
  const [health, setHealth] = useState<string[]>([]);
  const [liveRegion, setLiveRegion] = useState({do: '', si: ''} as RegionValue);
  const [workRegion, setWorkRegion] = useState({do: '', si: ''} as RegionValue);
  const [alarmTime, setAlarmTime] = useState('');

  return (
    <>
      <header className="border-b-2 px-4 py-2">
        <h1 className="text-2xl font-bold">회원가입 ※</h1>
      </header>
      
      <form id="registerForm" className="flex flex-col gap-4"
      onSubmit={()=>{}}
      >
        <div className="grid grid-cols-[max-content_1fr] items-center px-4 py-2 my-12 gap-x-3 gap-y-4">
          <label htmlFor="name" className="text-sm font-semibold">
            이름<span className="text-red-500">*</span>:
          </label>
          <input
          type="text" id="name" name="name" required
          className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="id" className="text-sm font-semibold">
            아이디<span className="text-red-500">*</span>:
          </label>
          <input
          type="id" id="id" name="id" required
          className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="password" className="text-sm font-semibold">
            비밀번호<span className="text-red-500">*</span>:
          </label>
          <input
          type="password" id="password" name="password" required
          className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="text-sm font-semibold">
            나이<span className="text-red-500">*</span>:
          </label>
          <select value={age} onChange={(e) => setAge(e.target.value)} required
          className="border w-28 rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">출생연도</option>
            {getYearOptions().map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold">
            건강상태<span className="text-red-500">*</span>:
          </label>
          <div>
            <MultiSelect
            options={healthOptions}
            value={health}
            onChange={setHealth}
            />
          </div>

          <label className="text-sm font-semibold">
            거주지역<span className="text-red-500">*</span>:
          </label>
          <RegionSelect
          className="border rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={liveRegion}
          onChange={setLiveRegion}
          required
          />

          <label className="text-sm font-semibold">
            직장/학교<span className="text-red-500">*</span>:
          </label>
          <RegionSelect
          className="border rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={workRegion}
          onChange={setWorkRegion}
          required
          />

          <label className="text-sm font-semibold">
            알림시간:
          </label>
          <select value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)}
          className="border w-28 rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">알림시간</option>
            {alarmOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        
        <div className="flex flex-col items-center gap-3 border-t-2 py-14">
          <button
          type="submit" form="registerForm"
          className="bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow"
          >
            회원가입
          </button>
        </div>
      </form>
    </>
  );
}
