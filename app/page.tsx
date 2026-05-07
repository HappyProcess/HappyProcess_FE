'use client'
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-6 text-center px-4">
      <h1 className="text-[40px] font-semibold leading-[1.10] tracking-[-0.374px] text-[#1d1d1f]">
        HappyProcess
      </h1>
      <p className="text-[21px] font-normal leading-[1.19] text-[#1d1d1f]">
        건강한 하루를 시작하세요.
      </p>
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="bg-[#0066cc] text-white rounded-full px-[22px] py-[11px] text-[17px] leading-none cursor-pointer active:scale-95 transition-transform focus:outline-2 focus:outline-[#0071e3]"
      >
        로그인
      </button>
    </div>
  );
}
