'use client'

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCachedProfile } from "#/lib/cache";
import { countUnread } from "#/service/alert";
import { type NotificationHistory, type Profile } from "#/service/types";
import { ALERT_HISTORY_UPDATED_EVENT } from "./AlertPoller";

const cleanName = (name: string) => name.replace(/^\d+/, "");

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getCachedProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        localStorage.setItem("userName", cleanName(nextProfile.name));
      })
      .catch(() => setProfile(null));
  }, [pathname]);
  // unread는 AlertPoller가 broadcast하는 ALERT_HISTORY_UPDATED_EVENT로만 갱신
  // (최초 로드 + 알림시간) → 페이지 이동마다 history 재호출 안 함

  useEffect(() => {
    const handleHistoryUpdated = (event: Event) => {
      const { history } = (event as CustomEvent<{
        history: NotificationHistory[];
      }>).detail;
      setUnread(countUnread(history));
    };
    const handleUserNameUpdated = () => {
      getCachedProfile().then(setProfile).catch(() => {});
    };

    window.addEventListener(ALERT_HISTORY_UPDATED_EVENT, handleHistoryUpdated);
    window.addEventListener("userNameUpdated", handleUserNameUpdated);

    return () => {
      window.removeEventListener(ALERT_HISTORY_UPDATED_EVENT, handleHistoryUpdated);
      window.removeEventListener("userNameUpdated", handleUserNameUpdated);
    };
  }, []);

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <header className="w-full shrink-0 bg-white px-5 pb-3 pt-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="text-left text-[26px] font-semibold leading-none tracking-[-0.374px] text-[#1d1d1f] active:scale-95"
        >
          Happy Process☀️
        </button>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.224px] text-[#1d1d1f] active:scale-95"
        >
          {profile ? `${cleanName(profile.name)}님` : "프로필"}
          <span className="text-[24px] text-[#7a7a7a]">👤</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-[#1d1d1f] pb-3">
        <div className="min-w-0" />
        <nav className="flex shrink-0 items-center gap-3 text-[14px] font-normal tracking-[-0.224px] text-[#1d1d1f]">
          <button type="button" onClick={() => router.push("/community")} className="active:scale-95">
            커뮤니티
          </button>
          <button type="button" onClick={() => router.push("/profile")} className="active:scale-95">
            프로필
          </button>
          <button type="button" onClick={() => router.push("/family")} className="active:scale-95">
            가족
          </button>
          <button
            type="button"
            onClick={() => router.push("/alarm")}
            className="relative text-[20px] leading-none active:scale-95"
            aria-label="알림"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4.25 rounded-full bg-[#0066cc] px-1 text-center text-[10px] font-semibold leading-[17px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
