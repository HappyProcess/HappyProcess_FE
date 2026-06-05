'use client'

import { CONDITION_ICON_INDEX_BY_NAME } from "@/constants/conditionIconMap";
import { useState } from "react";

export default function Post() {
  const conditions = { ...CONDITION_ICON_INDEX_BY_NAME, "자유게시판": 14 };
  const [categories, setCategories] = useState<number>(1 << 30);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const sliceMiddle = (text: string) => {
    if (text.length < 5) return (<>{text}</>);
    const middle = Math.floor(text.length / 2);
    return (
      <>
        {text.slice(0, middle)}
        <br />
        {text.slice(middle)}
      </>
    );
  }

  const toggleCategory = (idx: number) => {
    const flag = 1 << idx;
    let result = (categories & ~(1 << 30)) ^ flag;
    if (result == 0) result = 1 << 30;
    setCategories(result);
  }

  const getCategory = (idx: number): boolean => {
    const flag = 1 << idx;
    return (categories & flag) !== 0;
  }

  return (
    <div className="flex-1 flex flex-col bg-white px-5 pb-8 overflow-y-auto">
      <section className="flex-1 relative overflow-y-auto flex flex-col bg-white px-3">
        <h1 className="text-2xl font-bold pb-4 border-b border-[#38383b]">커뮤니티</h1>
        <div className="flex flex-row pt-4 gap-1">
          <h2 className="text-xl font-bold">
            분류
          </h2>
          <span>
            <button className={`px-1 border-2 border-gray-400 rounded-lg cursor-pointer text-sm
              ${getCategory(30) ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
              onClick={() => setCategories(1 << 30)}
            >전체</button>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 pb-2">
          {Object.entries(conditions).map(([name, idx]) => (
            <button key={name} className={`border-2 border-gray-400 rounded-lg cursor-pointer
              ${name.length == 4 ? "text-[0.75rem]" : "text-sm"}
              ${getCategory(idx) ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
              onClick={() => toggleCategory(idx)}
            >
              {sliceMiddle(name)}
            </button>
          ))}
        </div>

        <div className="w-full border-b" />

        <form className="flex flex-col flex-1"
          onSubmit={() => {/* 여기서 api호출 */ }}>
          <input
            className="mt-2 text-2xl font-bold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
          />
          <div className="w-full border-b mt-2" />
          <textarea
            className="my-2 resize-none flex-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요."
          />

          <div className="flex flex-row justify-between">
            <div className="flex items-center grow gap-2">
              <img
                className="h-10"
                src={image ? URL.createObjectURL(image) : "/resources/image-none.png"}
                alt="preview"
              />
              <label htmlFor="fileInput"
                className="cursor-pointer grow">
                {image ? image?.name : "사진 첨부"}
              </label>
              <input
                className="hidden"
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImage(file);
                }}
              />
            </div>
            <button type="submit"
              className="cursor-pointer border-2 border-gray-400 rounded-lg px-2 py-1 hover:bg-gray-100">
              등록
            </button>
          </div>
        </form>
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