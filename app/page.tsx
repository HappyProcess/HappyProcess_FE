'use client'
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-6 text-center px-4">
      <Image src="/logo.png" alt="Happy Process" width={282} height={72} priority />
      <p className="text-[21px] font-normal leading-[1.19] text-[#191f28]">
        건강한 하루를 시작하세요.
      </p>
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="bg-[#3182f6] text-white rounded-full px-5.5 py-2.75 text-[17px] leading-none cursor-pointer active:scale-95 transition-transform focus:outline-2 focus:outline-[#3182f6]"
      >
        로그인
      </button>
    </div>
  );
}
