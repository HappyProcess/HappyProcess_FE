'use client'
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getMyInformation } from "#/service/member"

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [name, setName] = useState<string>("")

  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { setName(""); return; }
      const userName = localStorage.getItem("userName");
      if (userName) { setName(userName); return; }
      getMyInformation()
        .then((profile) => {
          localStorage.setItem("userName", profile.name);
          setName(profile.name);
        })
        .catch(() => {});
    };

    sync();
    window.addEventListener("userNameUpdated", sync);
    return () => window.removeEventListener("userNameUpdated", sync);
  }, [pathname])

  return (
    <nav className="flex w-full justify-between items-center h-11 px-5 bg-black flex-shrink-0">
      <span
        className="text-white text-[12px] font-normal tracking-[-0.12px] cursor-pointer"
        onClick={() => router.push('/home')}
      >
        HappyProcess
      </span>
      {name && (
        <span
          className="text-white text-[12px] font-normal tracking-[-0.12px] cursor-pointer"
          onClick={() => router.push('/profile')}
        >
          {name}님
        </span>
      )}
    </nav>
  )
}
