'use client'

import { usePathname, useRouter } from "next/navigation";

type NavItem = {
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "홈",
    path: "/home",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.38 3.43a1 1 0 0 1 1.24 0l7.5 5.93a1 1 0 0 1 .38.79V20a1 1 0 0 1-1 1h-4.5v-5.5h-5.5V21H5a1 1 0 0 1-1-1v-9.85a1 1 0 0 1 .38-.79z" />
      </svg>
    ),
  },
  {
    label: "커뮤니티",
    path: "/community",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
      </svg>
    ),
  },
  {
    label: "프로필",
    path: "/profile",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
  {
    label: "가족",
    path: "/family",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" fill={active ? "currentColor" : "none"} />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur">
        {NAV_ITEMS.map(({ label, path, icon }) => {
          const active = pathname.startsWith(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => router.push(path)}
              className={`flex w-[64px] flex-col items-center gap-1 rounded-full py-1.5 transition-transform active:scale-95 ${
                active ? "text-[#191f28]" : "text-[#b0b8c1]"
              }`}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              {icon(active)}
              <span className={`text-[11px] leading-none ${active ? "font-bold" : "font-medium text-[#8b95a1]"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
