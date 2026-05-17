'use client'
import { getMyLocations } from "#/service/member";
import { Location, Weather } from "#/service/types";
import { useEffect, useState } from "react";
import FooterLogo from "@/components/FooterLogo"
import { Line } from "@/components"
import WeatherSection from "./WeatherSection";

export default function Home() {
  const [location, setLocation] = useState<Location>();
  const [tab, setTab] = useState<"weather" | "setting" | "profile">("weather");

  useEffect(() => {
    const getLocation = async () => {
      const locations = await getMyLocations();
      if (!locations.length) return null;
      setLocation(locations[0]);
      if (!location) return;
    }
 
    getLocation()
  },[]);

  return (
    <div className="min-w-sm max-w-md w-2/5 bg-white rounded-[18px] border border-[#e0e0e0] px-8 py-10 flex flex-col gap-4">
      <header className="flex items-center w-full justify-end gap-3">
        <span
        className="text-[12px] font-normal tracking-[-0.12px] cursor-pointer hover:underline"
        onClick={() => setTab("weather")}
        >행동지침</span>
        <span
          className="text-[12px] font-normal tracking-[-0.12px] cursor-pointer hover:underline"
          onClick={() => setTab("profile")}
        >프로필</span>
        <span
        className="text-[12px] font-normal tracking-[-0.12px] cursor-pointer hover:underline"
        onClick={() => setTab("setting")}
        >🔔</span>
      </header>
      <h1 className="font-semibold tracking-[-0.374px] text-[#1d1d1f]">
        {location?.city ?? "설정된 지역이 없습니다."}
      </h1>
      <Line/>
      <main className="flex flex-col items-center justify-center gap-5">
        {tab === "weather" && <WeatherSection loc={location} />}
        {/* {tab === "setting" && <SettingSection />} */}
        {/* {tab === "profile" && <ProfileSection />} */}
      </main>
      <Line />
      <FooterLogo />
      {/* <WeatherPredict /> */}
    </div>
  );
}
