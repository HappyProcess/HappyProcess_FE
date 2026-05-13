'use client'
import { getLocations } from "#/service/member";
import { Location, Weather } from "#/service/types";
import { getWeather } from "#/service/weather";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { Line, WeatherPredict } from "@/components"
import WeatherSection from "./WeatherSection";

export default function Home() {
  const [location, setLocation] = useState<Location>();
  const [weather, setWeather] = useState<Weather>();
  const [tab, setTab] = useState<"weather" | "setting" | "profile">("weather");
  const router = useRouter();

  useEffect(() => {
    const getLocation = async () => {
      const locations = await getLocations();
      if (!locations.length) return null;

      setLocation(locations[0]);
      if (!location) return;

      setWeather(await getWeather(location.lat, location.lon));
    }
 
    getLocation()
  },[]);

  return (
    <div className="w-fit max-w-lg bg-white rounded-[18px] border border-[#e0e0e0] px-8 py-10 flex flex-col gap-4">
      <header className="flex items-center min-w-sm w-full justify-end gap-3">
        <span
        className="text-[12px] font-normal tracking-[-0.12px] cursor-pointer hover:underline"
        onClick={() => setTab("weather")}
        >행동지침</span>
        <span
        className="text-[12px] font-normal tracking-[-0.12px] cursor-pointer hover:underline"
        onClick={() => setTab("setting")}
        >설정</span>
        <span
        className="text-[12px] font-normal tracking-[-0.12px] cursor-pointer hover:underline"
        onClick={() => setTab("profile")}
        >프로필</span>
      </header>
      <h1 className="text-2xl font-semibold tracking-[-0.374px] text-[#1d1d1f]">{location?.city ?? "설정된 지역이 없습니다."}</h1>
      <Line/>
      <main className="flex flex-col items-center justify-center gap-5">
        {tab === "weather" && <WeatherSection wtr={weather} />}
        {/* {tab === "setting" && <SettingSection />} */}
        {/* {tab === "profile" && <ProfileSection />} */}
      </main>
      <Line />
      <WeatherPredict />
    </div>
  );
}
