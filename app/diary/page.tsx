'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDiaries } from "#/service/diary";
import { type DiaryResponse, type DiaryWeatherSnapshot } from "#/service/types";
import { addDays, formatDateKo, todayISO } from "#/lib/format";
import { getStoredLocationType } from "@/constants/locationSelection";

const intensityTone = (intensity: number) => {
  if (intensity <= 2) return "bg-[rgba(3,178,108,0.12)] text-[#03b26c]";
  if (intensity === 3) return "bg-[rgba(254,152,0,0.14)] text-[#e08600]";
  return "bg-[rgba(240,68,82,0.12)] text-[#f04452]";
};

// 선택된 위치(집/직장)의 날씨, 없으면 있는 첫 번째로 폴백.
const pickWeather = (
  weathers: DiaryWeatherSnapshot[] | undefined,
  preferred: "HOME" | "WORK"
): DiaryWeatherSnapshot | undefined => {
  if (!weathers || weathers.length === 0) return undefined;
  return weathers.find((w) => w.locationType === preferred) ?? weathers[0];
};

export default function DiaryPage() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<DiaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferredLocation, setPreferredLocation] = useState<"HOME" | "WORK">("HOME");

  const today = todayISO();

  useEffect(() => {
    setPreferredLocation(getStoredLocationType());
  }, []);

  useEffect(() => {
    getDiaries(addDays(today, -29), today)
      .then((list) =>
        setDiaries([...list].sort((a, b) => b.entryDate.localeCompare(a.entryDate)))
      )
      .catch(() => setDiaries([]))
      .finally(() => setLoading(false));
  }, [today]);

  const hasToday = diaries.some((d) => d.entryDate === today);

  return (
    <div className="flex w-full flex-col bg-[#f2f4f6] px-5 pb-8 pt-2">
      <header className="pb-3">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#191f28]">증상 일기</h1>
      </header>

      <button
        type="button"
        onClick={() => router.push(`/diary/${today}`)}
        className="mb-4 flex items-center justify-between rounded-[16px] bg-[#3182f6] px-5 py-4 text-left transition-transform active:scale-[0.99]"
      >
        <div>
          {loading ? (
            <div className="h-[19px] w-36 animate-pulse rounded bg-white/30" />
          ) : (
            <p className="text-[15px] font-bold text-white">
              {hasToday ? "오늘 기록 수정하기" : "오늘 증상 기록하기"}
            </p>
          )}
          <p className="mt-0.5 text-[13px] font-medium text-white/80">{formatDateKo(today)}</p>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => router.push("/report")}
        className="mb-5 flex w-full items-center gap-3.5 rounded-[16px] bg-[#e8f3ff] px-4 py-4 text-left transition-transform active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#3182f6]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m7 14 4-4 3 3 5-6" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-[#191f28]">주간 리포트</p>
          <p className="mt-0.5 text-[13px] font-medium leading-[1.4] text-[#4e5968]">
            지난 한 주의 증상을 AI가 분석해드려요.
          </p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <h2 className="mb-2 px-1 text-[15px] font-bold text-[#191f28]">최근 기록</h2>

      {loading ? (
        <p className="rounded-[16px] bg-white px-5 py-10 text-center text-[14px] text-[#8b95a1]">
          불러오는 중...
        </p>
      ) : diaries.length === 0 ? (
        <p className="whitespace-pre-line rounded-[16px] bg-white px-5 py-14 text-center text-[14px] leading-[1.5] text-[#8b95a1]">
          {"아직 기록한 증상이 없어요.\n오늘 증상을 남겨보세요."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {diaries.map((diary) => (
            <li
              key={diary.diaryId}
              onClick={() => router.push(`/diary/${diary.entryDate}`)}
              className="cursor-pointer rounded-[16px] bg-white p-4 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold text-[#191f28]">{formatDateKo(diary.entryDate)}</p>
                {(() => {
                  const w = pickWeather(diary.weathers, preferredLocation);
                  return w?.temperature ? (
                    <span className="text-[13px] font-medium text-[#8b95a1]">
                      {w.weatherCondition ?? ""} {w.temperature}°
                    </span>
                  ) : null;
                })()}
              </div>

              {diary.symptoms.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {diary.symptoms.map((symptom) => (
                    <span
                      key={symptom.conditionId}
                      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${intensityTone(symptom.intensity)}`}
                    >
                      {symptom.conditionName} {symptom.intensity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[13px] text-[#8b95a1]">기록된 증상 없음</p>
              )}

              {diary.memo && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-[1.5] text-[#4e5968]">{diary.memo}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
