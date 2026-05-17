import { getDangerSummary, getRecommandation } from "#/service/recommandation";
import { Weather, DangerSummary, Location } from "#/service/types";
import { getWeather } from "#/service/weather";
import { WeatherIcon, IllnessIcon, ConditionIcon, RecommandIcon } from "@/components"
import { useEffect, useState } from "react";

type Props = {
  loc?: Location;
};

export default function WeatherSection({
  loc,
}: Props) {
  const [weather, setWeather] = useState<Weather>();
  const [summary, setSummary] = useState<DangerSummary>();
  const [actions, setActions] = useState([]);

  useEffect(()=>{
    const startFunc = async () => {
      if (!loc) return;
      setWeather(await getWeather(loc.lat, loc.lon));
      setSummary(await getDangerSummary(loc.lat, loc.lon));
      setActions(await getRecommandation(loc.lat, loc.lon));
    };

    startFunc()
  },[]);

  return (
    <>
      <section className="flex flex-row items-center border-2 border-red-100 rounded-2xl bg-red-50 w-full p-3 gap-5">
        <IllnessIcon index={1} scale={0.25}/>
        <div className="flex flex-col">
          <p className="font-bold">{summary?.targetConditionName ?? "천식"} 위험도</p>
          <h1 className="text-red-500 font-bold text-2xl">{summary?.dangerLevel ?? "높음"}</h1>
          <p className="font-semibold text-sm">{summary?.warningMessage ?? "외출 시 주의가 필요해요!"}</p>
        </div>
      </section>
      <section className="flex flex-row items-center border-2 border-gray-300 rounded-2xl w-full p-3 gap-5">
        <WeatherIcon index={0} isOnlyIcon={true} />
        <div className="flex flex-col">
          <p className="">{"맑음"}</p>
          <h1 className="text-5xl font-bold -mt-2">{weather?.temperature ?? 20.1}˚</h1>
          <p className="text-sm">체감 {19.8} | 습도 {weather?.humidity ?? 0}%</p>
        </div>
      </section>
      <section className="flex flex-row gap-2 justify-between w-full">
        <div className="flex flex-col justify-between w-1/3 border-2 border-gray-300 border-t-blue-600 rounded-2xl gap-2 p-2">
          <h1  className="text-sm">미세먼지<span className="text-xs">{"(PM10)"}</span></h1>
          <p className="text-blue-400">좋음</p>
          <div className="flex flex-row justify-between items-center gap-2">
            <p>{weather?.fineDust ?? 0}㎍/㎡</p>
            <ConditionIcon index={0} scale={0.1875} />
          </div>
        </div>
        <div className="flex flex-col justify-between w-1/3 border-2 border-gray-300 border-t-blue-600 rounded-2xl gap-2 p-2">
          <h1 className="text-sm">초미세먼지<span className="text-xs">{"(PM2.5)"}</span></h1>
          <p className="text-blue-400">좋음</p>
          <div className="flex flex-row justify-between items-center gap-2">
            <p>{weather?.fineDust ?? 0}㎍/㎡</p>
            <ConditionIcon index={0} scale={0.1875} />
          </div>
        </div>
        <div className="flex flex-col justify-between w-1/3 border-2 border-gray-300 border-t-blue-600 rounded-2xl gap-2 p-2">
          <h1 className="text-sm">자외선<span className="text-xs">{"(UV)"}</span></h1>
          <p className="text-blue-400">좋음</p>
          <div className="flex flex-row justify-between items-center gap-2">
            <p>{weather?.fineDust ?? 0}</p>
            <ConditionIcon index={0} scale={0.1875} />
          </div>
        </div>
      </section>
      <section className="flex flex-col w-full">
        <h1>✅ 오늘의 행동 추천</h1>
        <div className="w-full flex flex-row items-center gap-2.5">
          {/* {actions.map(()=>{
            return(
              <div className="flex flex-col items-center">
                <RecommandIcon index={0} scale={0.3125} />
                <h1 className="font-bold text-sm ">!이름!</h1>
                <p className="text-xs text-center">!설명!</p>
              </div>
            )
          })} */}
          <div className="flex flex-col items-center">
            <RecommandIcon index={0} scale={0.3125} />
            <h1 className="font-bold text-sm ">마스크 착용</h1>
            <p className="text-xs text-center">외출 시 마스크를<br/>착용해 주세요</p>
          </div>
          <div className="flex flex-col items-center">
            <RecommandIcon index={1} scale={0.3125} />
            <h1 className="font-bold text-sm ">운동 자제</h1>
            <p className="text-xs text-center">격한 운동은<br />피해주세요</p>
          </div>
        </div>
      </section>
    </>
  )
}