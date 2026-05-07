'use client'
import { useRouter } from "next/navigation";
import { login } from "@/service/auth";
import toast from "react-hot-toast";
import { parseError } from "@/lib/parseError";

const inputClass = "w-full border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] leading-[1.47] tracking-[-0.374px] bg-white focus:outline-2 focus:outline-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
const labelClass = "text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]"

export default function Login() {
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    try {
      const data = await login(id, password);
      console.log("로그인 성공:", data);
      router.push("/");
    } catch (err) {
      toast.error(parseError(err));
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-[18px] border border-[#e0e0e0] px-8 py-10 flex flex-col gap-6">
      <h1 className="text-[28px] font-semibold leading-[1.14] tracking-[-0.374px] text-[#1d1d1f] text-center">
        로그인
      </h1>

      <form id="loginForm" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="id" className={labelClass}>아이디</label>
          <input type="text" id="id" name="id" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={labelClass}>비밀번호</label>
          <input type="password" id="password" name="password" required className={inputClass} />
        </div>

        <button
          type="submit"
          className="w-full bg-[#0066cc] text-white rounded-full py-[11px] text-[17px] leading-none cursor-pointer active:scale-95 transition-transform focus:outline-2 focus:outline-[#0071e3] mt-2"
        >
          로그인
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e0e0e0]" />
        <span className="text-[14px] text-[#7a7a7a]">또는</span>
        <div className="flex-1 h-px bg-[#e0e0e0]" />
      </div>

      <button
        type="button"
        onClick={() => router.push('/register')}
        className="w-full border border-[#0066cc] text-[#0066cc] rounded-full py-[11px] text-[17px] leading-none cursor-pointer active:scale-95 transition-transform"
      >
        회원가입
      </button>
    </div>
  )
}
