import { api } from "#/lib/api";
import { type DangerSummary } from "./types"

export const getDangerSummary = async (lat: number, lon: number): Promise<DangerSummary> => {
  const data: any = { lat, lon }
  const res = await api.get("/recommendations/summary", data);
  return res.data;
};

export const getRecommandation = async (lat: number, lon: number): Promise<never[]> => {
  const data: any = { lat, lon }
  const res = await api.get("/recommendations/actions", data);
  return res.data;
};