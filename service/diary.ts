import { api } from "#/lib/api";
import { type DiaryResponse } from "./types";

export type DiarySymptomInput = {
  conditionId: number;
  intensity: number; // 1~5
};

export type UpsertDiaryInput = {
  entryDate: string; // "YYYY-MM-DD"
  memo?: string;
  symptoms: DiarySymptomInput[];
};

// 작성/수정 — entryDate 기준 upsert(하루 1건)
export const upsertDiary = async (input: UpsertDiaryInput): Promise<DiaryResponse> => {
  const res = await api.post("/diaries", input);
  return res.data;
};

// 기간별 조회
export const getDiaries = async (from: string, to: string): Promise<DiaryResponse[]> => {
  const res = await api.get("/diaries", { params: { from, to } });
  return res.data;
};

// 특정 날짜 조회 — 없으면 404 DIARY_NOT_FOUND
export const getDiary = async (date: string): Promise<DiaryResponse> => {
  const res = await api.get(`/diaries/${date}`);
  return res.data;
};

export const deleteDiary = async (date: string): Promise<void> => {
  await api.delete(`/diaries/${date}`);
};
