'use client'
import { useRouter } from "next/navigation";
import { login } from "#/service/auth";
import { getMyInformation } from "#/service/member";
import toast from "react-hot-toast";
import { parseError } from "#/lib/parseError";

const inputClass = "w-full border border-[#e5e8eb] rounded-[14px] px-4 py-3.5 text-[17px] text-[#191f28] leading-[1.47] tracking-[-0.01em] bg-white focus:outline-2 focus:outline-[#3182f6] focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
const labelClass = "text-[14px] font-semibold tracking-[-0.01em] text-[#191f28]"

export default function Login() {
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    try {
      const data = await login(id, password);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      const profile = await getMyInformation();
      localStorage.setItem("userName", profile.name);
      router.push("/home");
    } catch (err) {
      toast.error(parseError(err));
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10">
    <div className="w-full max-w-sm bg-white rounded-[20px] px-8 py-10 flex flex-col gap-6">
      <h1 className="text-[28px] font-semibold leading-[1.14] tracking-[-0.01em] text-[#191f28] text-center">
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
          className="w-full bg-[#3182f6] text-white rounded-[14px] py-4 text-[17px] font-semibold leading-none cursor-pointer active:scale-[0.98] transition-transform focus:outline-2 focus:outline-[#3182f6] mt-2"
        >
          로그인
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e5e8eb]" />
        <span className="text-[14px] text-[#8b95a1]">또는</span>
        <div className="flex-1 h-px bg-[#e5e8eb]" />
      </div>

      <button
        type="button"
        onClick={() => router.push('/register')}
        className="w-full border border-[#3182f6] text-[#3182f6] rounded-[14px] py-4 text-[17px] font-semibold leading-none cursor-pointer active:scale-[0.98] transition-transform"
      >
        회원가입
      </button>
    </div>
    </div>
  )
}
