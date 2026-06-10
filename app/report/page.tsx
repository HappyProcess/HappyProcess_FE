'use client'

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { generateWeeklyReport, getWeeklyReport } from "#/service/report";
import { type WeeklyReportResponse } from "#/service/types";
import { parseError } from "#/lib/parseError";
import { addDays, mondayOf, todayISO } from "#/lib/format";

const GEN_STEPS = [
  "증상 기록을 모으고 있어요",
  "날씨와 증상의 관계를 분석 중이에요",
  "패턴을 찾고 있어요",
  "맞춤 리포트를 작성하고 있어요",
];

const formatRange = (from: string, to: string) => {
  const [, fm, fd] = from.split("-");
  const [, tm, td] = to.split("-");
  return `${Number(fm)}월 ${Number(fd)}일 ~ ${Number(tm)}월 ${Number(td)}일`;
};

export default function WeeklyReportPage() {
  const router = useRouter();
  const thisMonday = mondayOf(todayISO());
  // 기본값: 지난주 월요일
  const [weekStart, setWeekStart] = useState(() => addDays(mondayOf(todayISO()), -7));
  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genProgress, setGenProgress] = useState(0);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = weekStart === thisMonday;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWeeklyReport(weekStart);
      setReport(data);
    } catch (err) {
      // 404 REPORT_NOT_FOUND → 미생성 상태로 처리, 그 외는 토스트
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setReport(null);
      } else {
        setReport(null);
        toast.error(parseError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  // 생성 중 단계 메시지를 순차로 흘려 보여준다(실제 진행률이 아닌 체감용).
  useEffect(() => {
    if (!generating) return;
    // 메시지는 순차로, 진행바는 다음 프레임에 목표치로 — CSS transition이 0→90%를 채운다.
    const raf = window.requestAnimationFrame(() => setGenProgress(90));
    const timer = window.setInterval(() => {
      setGenStep((step) => Math.min(step + 1, GEN_STEPS.length - 1));
    }, 700);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(timer);
    };
  }, [generating]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenStep(0);
    setGenProgress(0);
    setGenerating(true);
    try {
      const data = await generateWeeklyReport(weekStart);
      setReport(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        toast.error("그 주에 작성된 일기가 없어 리포트를 만들 수 없어요.");
      } else {
        toast.error(parseError(err));
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#f2f4f6] px-5 pb-8 pt-2">
      <div className="mb-3 flex items-center">
        <button
          type="button"
          onClick={() => router.push("/diary")}
          className="-ml-1 flex items-center gap-1 py-1 pr-2 text-[15px] font-semibold text-[#4e5968] active:scale-[0.97]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          증상 일기
        </button>
      </div>

      <h1 className="px-1 text-[24px] font-bold tracking-[-0.02em] text-[#191f28]">주간 리포트</h1>

      {/* 주차 선택 */}
      <div className="mt-3 flex items-center justify-between rounded-[16px] bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="grid h-9 w-9 place-items-center rounded-full text-[#4e5968] active:scale-90 active:bg-[#f2f4f6]"
          aria-label="이전 주"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-[15px] font-bold text-[#191f28]">{formatRange(weekStart, weekEnd)}</p>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          disabled={isCurrentWeek}
          className="grid h-9 w-9 place-items-center rounded-full text-[#4e5968] transition-opacity active:scale-90 active:bg-[#f2f4f6] disabled:opacity-30"
          aria-label="다음 주"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex-1">
        {generating ? (
          <GeneratingView step={genStep} progress={genProgress} />
        ) : loading ? (
          <div className="rounded-[16px] bg-white p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#f2f4f6]" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#f2f4f6]" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-[#f2f4f6]" />
          </div>
        ) : report ? (
          <div className="flex flex-col gap-4">
            {/* 요약 */}
            <article className="rounded-[16px] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#191f28]">한 주 요약</h2>
              <p className="mt-2 whitespace-pre-wrap break-keep text-[15px] leading-[1.7] text-[#333d4b]">
                {report.summary}
              </p>
            </article>

            {/* 패턴 — 어떤 날씨일 때 어떤 증상이 어떻게 */}
            {report.patterns.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-[15px] font-bold text-[#191f28]">발견된 패턴</h2>
                <div className="flex flex-col gap-2.5">
                  {report.patterns.map((pattern, index) => (
                    <article key={index} className="rounded-[16px] bg-white p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-[#e8f3ff] px-2.5 py-1 text-[12px] font-semibold leading-none text-[#1b64da]">
                          {pattern.weather}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="rounded-full bg-[#fdecee] px-2.5 py-1 text-[12px] font-semibold leading-none text-[#f04452]">
                          {pattern.symptom}
                        </span>
                      </div>
                      <p className="mt-2.5 break-keep text-[14px] leading-[1.6] text-[#4e5968]">
                        {pattern.observation}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 솔루션 — 증상/상황별 조치 체크리스트 */}
            {report.solutions.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-[15px] font-bold text-[#191f28]">이렇게 해보세요</h2>
                <ul className="overflow-hidden rounded-[16px] bg-white">
                  {report.solutions.map((solution, index) => (
                    <li
                      key={index}
                      className={`flex gap-3 p-4 ${index > 0 ? "border-t border-[#f2f4f6]" : ""}`}
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#3182f6]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold leading-[1.4] text-[#191f28]">{solution.target}</p>
                        <p className="mt-0.5 break-keep text-[14px] leading-[1.6] text-[#4e5968]">
                          {solution.action}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
          <div className="rounded-[16px] bg-white px-5 py-12 text-center">
            <p className="text-[15px] font-semibold leading-[1.5] text-[#4e5968]">
              아직 이 주의 리포트가 없어요.
            </p>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#8b95a1]">
              작성한 증상 일기를 바탕으로 리포트를 만들어드려요.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-5 h-12 w-full rounded-[14px] bg-[#3182f6] text-[15px] font-semibold text-white transition-transform active:scale-[0.99] active:bg-[#2272eb]"
            >
              리포트 생성하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GeneratingView({ step, progress }: { step: number; progress: number }) {
  const message = GEN_STEPS[Math.min(step, GEN_STEPS.length - 1)];

  return (
    <div className="rounded-[20px] bg-white px-6 py-14">
      {/* 중앙 AI 오브 — 떠오르는 글로우 + 회전 링 + 펄스 */}
      <div className="report-float relative mx-auto h-24 w-24" style={{ animation: "reportFloat 2.8s ease-in-out infinite" }}>
        <span className="absolute inset-0 rounded-full bg-[#3182f6] opacity-20 blur-xl" />
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, #3182f6, #8ec0ff, #3182f6)",
            animation: "spin 2.2s linear infinite",
            mask: "radial-gradient(circle, transparent 58%, black 60%)",
            WebkitMask: "radial-gradient(circle, transparent 58%, black 60%)",
          }}
        />
        <span className="absolute inset-[14px] grid place-items-center rounded-full bg-[#e8f3ff]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4z" fill="#3182f6" />
            <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#3182f6" stroke="none" />
          </svg>
        </span>
      </div>

      <p className="mt-7 text-center text-[18px] font-bold tracking-[-0.02em] text-[#191f28]">
        리포트를 만들고 있어요
      </p>

      {/* 단계 메시지 — step이 바뀔 때마다 떠오르며 교체 */}
      <p
        key={step}
        className="report-step mt-1.5 text-center text-[14px] font-medium text-[#8b95a1]"
        style={{ animation: "reportStepIn 0.4s ease-out" }}
      >
        {message}
      </p>

      {/* 진행바 — 응답이 오기까지 0→90%를 부드럽게 채운다 */}
      <div className="mx-auto mt-7 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[#f2f4f6]">
        <span
          className="block h-full rounded-full bg-[#3182f6]"
          style={{
            width: `${progress}%`,
            transition: "width 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
