'use client'
import { getCachedConditions, getCachedLocations } from "#/lib/cache";
import { Location, Weather, Condition } from "#/service/types";
import { getWeather } from "#/service/weather";
import { useEffect, useState } from "react";
import WeatherSection from "./WeatherSection";
import AlarmSection from "./AlramSection";

export default function Home() {
  const [locations, setLocations] = useState<{ home?: Location; work?: Location }>({});
  const [weathers, setWeathers] = useState<{ home?: Weather; work?: Weather }>({});
  const [loading, setLoading] = useState(true);
  const [locType, setLocType] = useState<"HOME" | "WORK">("HOME");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getCachedConditions().then(setConditions).catch(() => { });
  }, []);

  useEffect(() => {
    getCachedLocations().then((list) => {
      const home = list.find((l) => l.locationType === "HOME");
      const work = list.find((l) => l.locationType === "WORK");
      setLocations({ home, work });

      const fetches = [
        home ? getWeather(home.areaNo).then((w) => ({ type: "home", w })) : null,
        work ? getWeather(work.areaNo).then((w) => ({ type: "work", w })) : null,
      ].filter(Boolean) as Promise<{ type: string; w: Weather }>[];

      Promise.all(fetches).then((results) => {
        const next: { home?: Weather; work?: Weather } = {};
        results.forEach(({ type, w }) => { next[type as "home" | "work"] = w; });
        setWeathers(next);
        setLoading(false);
      });
    });
  }, []);

  const location = locType === "HOME" ? locations.home : locations.work;
  const weather = locType === "HOME" ? weathers.home : weathers.work;
  const hasHome = !!locations.home;
  const hasWork = !!locations.work;

  const dateStr = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col">
      {/* 본문 */}
      <div className="flex flex-col flex-1 px-5 py-6 gap-5">

        {/* 지역 & 시간 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f] leading-snug">
              {location
                ? `${location.sido} ${location.sigungu}`
                : "지역 미설정"}
            </h1>
            {location && (
              <p className="text-[13px] text-[#7a7a7a] tracking-[-0.224px]">
                {location.dong}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              {timeStr}
            </span>
            <span className="text-[12px] text-[#7a7a7a] tracking-[-0.12px]">
              {dateStr}
            </span>
          </div>
        </div>

        {/* 홈/직장 탭 */}
        {(hasHome || hasWork) && (
          <div className="flex items-center self-start gap-1 bg-[#f5f5f7] rounded-full p-0.5">
            <button
              onClick={() => setLocType("HOME")}
              className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${locType === "HOME"
                ? "bg-white text-[#1d1d1f] shadow-sm font-semibold"
                : "text-[#7a7a7a] font-normal"
                }`}
            >
              집
            </button>
            <button
              onClick={() => setLocType("WORK")}
              className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${locType === "WORK"
                ? "bg-white text-[#1d1d1f] shadow-sm font-semibold"
                : "text-[#7a7a7a] font-normal"
                }`}
            >
              직장
            </button>
          </div>
        )}

        {/* 질병 태그 */}
        {conditions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {conditions.map((c) => (
              <span
                key={c.conditionId}
                className="px-3 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-[13px] tracking-[-0.224px]"
              >
                {c.conditionName}
              </span>
            ))}
          </div>
        )}

        {/* 날씨 섹션 */}
        <WeatherSection weather={weather} loading={loading} />

      </div>
    </div>
  );
}
