'use client'
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  

  return (
    <>
      <header className="border-b-2 px-4 py-2">
        <h1 className="text-2xl font-bold">회원가입 ※</h1>
      </header>
      
      <form id="loginForm" className="flex flex-col gap-4"
      onSubmit={()=>{}}
      >
        <div className="grid grid-cols-[max-content_1fr] items-center px-4 py-2 my-12 gap-x-3 gap-y-4">
          <label htmlFor="id" className="text-sm font-semibold">
            이름:
          </label>
          <input
          type="id" id="id" name="id" required
          className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

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
          
        </div>
      </form>
    </>
  );
}
