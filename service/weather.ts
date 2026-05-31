import { api } from "#/lib/api";
import { Weather } from "./types";

const cache = new Map<string, { data: Weather; ts: number }>();
const TTL = 10 * 60 * 1000; // 10분

export const getWeather = async (areaNo: string): Promise<Weather> => {
  const hit = cache.get(areaNo);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const res = await api.get("/weather/combined", { params: { areaNo } });
  cache.set(areaNo, { data: res.data, ts: Date.now() });
  return res.data;
};