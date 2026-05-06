'use client'
import { useRouter } from "next/navigation";
import { login } from "@/service/auth";


export default function Login() {
  const router = useRouter()

  const gotoRegister = () => {
    router.push(`/register`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const id = formData.get("id")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    try {
      const data = await login(id, password);
      console.log("로그인 성공:", data);

      router.push("/"); // 로그인 성공 후 홈으로 이동
      // TODO: 토큰 저장 or 페이지 이동
    } catch (err) {
      console.error("로그인 실패", err);
    }
  }

  return(
    <>
      <header className="border-b-2 px-4 py-2">
        <h1 className="text-2xl font-bold">로그인 ※</h1>
      </header>
      
      <form id="loginForm" className="flex flex-col gap-4"
      onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid grid-cols-[max-content_1fr] items-center px-4 py-2 my-12 gap-x-3 gap-y-4">
          <label htmlFor="id" className="text-sm font-semibold">
            아이디:
          </label>
          <input
          type="id" id="id" name="id" required
          className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="password" className="text-sm font-semibold">
            비밀번호:
          </label>
          <input
          type="password" id="password" name="password" required
          className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        
        <div className="flex flex-col items-center gap-3 border-t-2 py-14">
          <button
          type="submit" form="loginForm"
          className="bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow"
          >
            로그인
          </button>
          <p>또는</p>
          <button
          type="button" onClick={gotoRegister}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow"
          >
            회원가입
          </button>
        </div>
      </form>
    </>
  )
}