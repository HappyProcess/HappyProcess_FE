'use client'
import { useRouter } from "next/navigation"

export default function Navigation(
  
) {
  const router = useRouter()
  return (
    <nav className="flex w-full justify-between items-center h-11 px-5 bg-black">
      <span
        className="text-white text-[12px] font-normal tracking-[-0.12px] cursor-pointer"
        onClick={() => router.push('/')}
      >
        HappyProcess
      </span>
    </nav>
  )
}
