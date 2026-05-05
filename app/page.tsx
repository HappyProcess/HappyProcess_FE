'use client'
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()

  const gotoLogin = () => {
    router.push(`/login`)
  }

  return (
    <>
      <button type="button" onClick={gotoLogin} 
      className="min-w-fit max-w-fit bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow">
        로그인
      </button>
    </>
  );
}
