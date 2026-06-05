'use client'
import Icon from "@/components/IconComponents/Icon";
import { CONDITION_ICON_INDEX_BY_NAME } from "@/constants/conditionIconMap";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Community(){
  const router = useRouter();
  const conditions = { ...CONDITION_ICON_INDEX_BY_NAME, "자유게시판":14};
  const [categories, setCategories] = useState<number>(1<<30);
  const [isRecentOrder, setRecentOrder] = useState<boolean>(true);

  const sliceMiddle = (text: string) => {
    if (text.length < 5) return (<>{ text }</>);
    const middle = Math.floor(text.length/2);
    return (
      <>
        {text.slice(0,middle)}
        <br/>
        {text.slice(middle)}
      </>
    );
  }

  const toggleCategory = (idx: number) => {
    const flag = 1 << idx;
    let result = (categories & ~(1<<30)) ^ flag;
    if(result == 0) result = 1<<30;
    setCategories(result);
  }

  const getCategory = (idx: number): boolean => {
    const flag = 1 << idx;
    return (categories & flag) !== 0;
  }

  return (
    <div className="flex flex-col bg-white px-5 pb-8 overflow-y-auto">
      <h1 className="text-2xl font-bold pb-4 border-b border-[#38383b]">커뮤니티</h1>
      <section className="relative overflow-y-auto flex flex-col bg-white px-3">
        <div className="flex flex-row pt-4 gap-1">
          <h2 className="text-xl font-bold">
            분류
          </h2>
          <span>
            <button className={`px-1 border-2 border-gray-400 rounded-lg cursor-pointer text-sm
              ${getCategory(30) ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
              onClick={() => setCategories(1<<30)}
            >전체</button>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Object.entries(conditions).map(([name, idx]) => (
            <button key={name} className={`border-2 border-gray-400 rounded-lg cursor-pointer
              ${name.length == 4 ? "text-[0.75rem]": "text-sm"}
              ${getCategory(idx) ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
              onClick={()=> toggleCategory(idx)}
              >
              {sliceMiddle(name)}
            </button>
          ))}
        </div>

        <div className="flex flex-row justify-between border-b pt-4 pb-1">
          <h2 className="text-xl font-bold">게시글</h2>
          <div className="flex border-2 border-gray-400 rounded-lg gap-1 p-1">
            <button className={`rounded-lg cursor-pointer text-sm
              ${isRecentOrder ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
              onClick={() => setRecentOrder(true)}
            >최신순</button>
            <button className={`rounded-lg cursor-pointer text-sm
              ${!isRecentOrder ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
              onClick={() => setRecentOrder(false)}
            >공감순</button>
          </div>
        </div>
        <ul className="p-1 overflow-y-auto">
          {[...Array(10)].map((_, i) => ( //여기에 게시글 리스트대로 반복
            <li key={i} className="flex items-center justify-between border-b py-2 gap-1 hover:bg-gray-100"
            onClick={()=> {/* 여기에 게시글로 이동 함수 넣기 */}}
            >
              <div className="grow flex justify-between">
                <div className="">
                  <h3>{"제목"}</h3>
                  <p className="text-[0.75rem]">{"작성자"} {"작성시각"} 조회 { 0 } 공감 { 0 }</p>
                  <p className="text-[0.75rem]">
                    {[...Array(2)].map((_, i) => 
                      "#카테고리명 "
                    )}
                  </p>
                </div>
                <img alt="사진첨부" className="bg-gray-300 w-fit h-fit"/>
              </div>
              <div className="
              flex flex-col h-fit justify-center items-center px-1
              border-2 border-gray-400 rounded-lg">
                <p>{ 0 }</p>
                <p className="text-sm">댓글</p>
              </div>
            </li>
          ))}
        </ul>
        <button className="w-fit cursor-pointer absolute bottom-1 right-1"
          onClick={() => { router.push("/write")}}>
          <Icon
            className="rounded-lg"
            path={"/resources/write_button.png"}
            scale={0.5}
            size={110}
            cols={1}
            rows={1}
            gap={0}
            index={0} />
        </button>
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