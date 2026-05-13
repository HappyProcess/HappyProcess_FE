import { Weather } from "#/service/types";
import { WeatherIcon } from "@/components"
import { useEffect, useState } from "react";

type Props = {
  wtr?: Weather;
};

export default function WeatherSection({
  wtr,
}: Props) {
  const [weather, setWeather] = useState<Weather>();

  useEffect(()=>{
    setWeather(wtr);
  },[]);

  return (
    <>
      <section className="flex flex-row items-center justify-center">
        <span className=""><WeatherIcon index={0} isOnlyIcon={true} /></span>
        <div className="flex flex-col">
          <p>맑음</p>
          <h1 className="text-3xl font-bold">{weather?.temperature ?? 20}℃</h1>
        </div>
      </section>
      <section className="flex flex-row gap-2">
        <div className="flex flex-col items-center bg-blue-50 gap-3 p-2">
          <h1>미세먼지</h1>
          <p className="text-blue-400">{weather?.fineDust ?? "좋음"}</p>
        </div>
        <div className="flex flex-col items-center bg-blue-50 gap-3 p-2">
          <h1>초미세먼지</h1>
          <p className="text-blue-400">{weather?.fineDust ?? "좋음"}</p>
        </div>
        <div className="flex flex-col items-center bg-blue-50 gap-3 p-2">
          <h1>자외선</h1>
          <p className="text-blue-400">{weather?.fineDust ?? "좋음"}</p>
        </div>
      </section>
      <section className="flex flex-col items-center bg-red-50 w-full py-5 gap-5">
        <h1 className="text-red-500 font-bold text-2xl">천식 위험도 높음</h1>
        <p className="font-bold">명관님, 오늘 외출에 주의해주세요.</p>
      </section>
    </>
  )
}