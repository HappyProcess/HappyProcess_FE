'use client'
import { useState } from "react";

export default function Post(){
  const [heart, setHeart] = useState<boolean>(false);
  
  return (
    <div className="flex flex-col bg-white px-5 pb-8 overflow-y-auto">
      <section className="flex flex-col items-center gap-2 px-2 overflow-y-auto">
        <div className="w-full border-b pb-2">
          <h1 className="text-2xl font-bold">{"제목"}</h1>
          <div className="flex flex-row items-center gap-2">
            <span className="text-[24px] text-[#7a7a7a]">👤</span>
            <div className="flex flex-col mt-1">
              <p className="text-[0.75rem]">{"작성자"}</p>
              <p className="text-[0.75rem]">
                {"작성날짜"} {"작성시각"} 조회 { 0 }
                {[...Array(2)].map((_, i) =>
                  "#카테고리명 "
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full whitespace-pre-wrap overflow-y-auto">
          <img alt="사진첨부" className="bg-gray-300 w-fit h-fit" />
          {"게시글 내용들 \n줄바꿈 허용됨\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"}
        </div>

        <button className="border-2 border-gray-400 px-2 py-1 w-fit rounded-lg"
        onClick={()=>setHeart(!heart)}
        >
          <span className="text-xl text-red-400 pr-1">{heart?"♥":"♡"}</span>
          공감 { 0 }
        </button>

        <div className="w-full border-b"/>

        <div className="w-full overflow-y-auto">
          <p>댓글 { 0 }</p>
          <ul className="p-1 overflow-y-auto">
            {[...Array(10)].map((_, i) => (
              <li key={i} className="flex flex-row gap-2">
                <span className="text-[24px] text-[#7a7a7a]">👤</span>
                <div className="flex flex-col mt-1">
                  <p className="text-[0.75rem]">{"작성자"}</p>
                  <p className="text-[0.75rem]">{"내용"}</p>
                  <p className="text-[0.75rem]">{"작성날짜"} {"작성시각"}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <footer className="mt-2 border-t border-[#1d1d1f] pt-4 text-center">
        <p className="text-[26px] font-semibold leading-none tracking-[-0.374px] text-[#1d1d1f]">
          Happy Process☀️
        </p>
        <p className="mt-4 text-[10px] font-normal leading-[1.3] tracking-[-0.08px] text-[#1d1d1f]">
          ※ 본 서비스의 건강 정보 및 행동 추천은 참고용 가이드이며, 의료 진단을 대체하지 않습니다.
        </p>
      </footer>
    </div>
  );
}