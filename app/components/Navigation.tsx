'use client'

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCachedProfile } from "#/lib/cache";
import { countUnread } from "#/service/alert";
import { type NotificationHistory, type Profile } from "#/service/types";
import { ALERT_HISTORY_UPDATED_EVENT } from "./AlertPoller";

const cleanName = (name: string) => name.replace(/^\d+/, "");

const NAV_ITEMS = [
  { label: "커뮤니티", path: "/community" },
  { label: "프로필", path: "/profile" },
  { label: "가족", path: "/family" },
];

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
    <header className="w-full shrink-0 bg-white px-5 pb-2.5 pt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="active:scale-95"
          aria-label="홈"
        >
          <Image src="/logo.png" alt="Happy Process" width={132} height={34} priority />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/alarm")}
            className="relative grid h-9 w-9 place-items-center rounded-full active:scale-90"
            aria-label="알림"
          >
            <Image src="/bell.png" alt="알림" width={21} height={21} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-[#3182f6] px-1 text-center text-[10px] font-bold leading-[16px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 rounded-full bg-[#f2f4f6] py-1 pl-3 pr-1 text-[13px] font-semibold text-[#4e5968] active:scale-95"
          >
            {profile ? `${cleanName(profile.name)}님` : "프로필"}
            <Image
              src="/person.png"
              alt=""
              width={26}
              height={26}
              className="rounded-full"
            />
          </button>
        </div>
      </div>

      <nav className="mt-3 flex items-center gap-5 text-[15px] font-semibold tracking-[-0.01em]">
        {NAV_ITEMS.map(({ label, path }) => {
          const active = pathname.startsWith(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => router.push(path)}
              className={`relative pb-1 active:scale-95 ${
                active ? "text-[#191f28]" : "text-[#8b95a1]"
              }`}
            >
              {label}
              {active && (
                <span className="absolute -bottom-px left-0 h-[2.5px] w-full rounded-full bg-[#3182f6]" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
