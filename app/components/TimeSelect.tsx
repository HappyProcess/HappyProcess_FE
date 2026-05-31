'use client'
import {commuteOptions} from "@/register/Options";
import { useState } from "react";
import SwitchIcon from "./IconComponents/switchIcon";

type TimeSelectProps = {
  index: number;
  time: string;
}

export default function TimeSelect({
  index,
  time,
}: TimeSelectProps) {
  const [selectedTime, setSelectedTime] = useState(time);
  const [isEditing, setEditing] = useState(false);
  
  return (
    <>
      <div className="w-full grid grid-cols-2 gap-3">
        {isEditing ?
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="font-bold text-3xl w-fit -my-0.75 -ml-1 cursor-pointer"
          >
            {commuteOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          :
          <h1 className="cursor-default font-bold text-3xl">{selectedTime}</h1>
        }
        <div className='flex flex-row items-center justify-between'>
          <SwitchIcon scale={5 / 32} className="cursor-pointer" />
          <p className="cursor-pointer" onClick={()=>setEditing(!isEditing)}>
            {isEditing ? "완료" : "편집"}
          </p>
        </div>
      </div>
      <div className="h-0 border-gray-300 w-full border-y" />
      
    </>
  );
}