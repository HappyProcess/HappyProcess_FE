import { api } from "#/lib/api";
import { type WeeklyReportResponse } from "./types";

// 주간 리포트 생성(Gemini). weekStart 생략 시 지난주.
// 해당 주 일기 없으면 400(NO_DIARY_FOR_REPORT). 이미 생성된 주차면 캐시 반환.
// weekStart는 주 중 아무 날짜나 보내면 그 주 월요일로 정규화됨. 생성에 수 초 소요.
export const generateWeeklyReport = async (
  weekStart?: string
): Promise<WeeklyReportResponse> => {
  const res = await api.post("/reports/weekly/generate", null, {
    params: weekStart ? { weekStart } : undefined,
  });
  return res.data;
};

// 주간 리포트 조회 — 미생성 시 404 REPORT_NOT_FOUND
export const getWeeklyReport = async (
  weekStart: string
): Promise<WeeklyReportResponse> => {
  const res = await api.get("/reports/weekly", { params: { weekStart } });
  return res.data;
};
