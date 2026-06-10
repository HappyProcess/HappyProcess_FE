import { api } from "#/lib/api";
import { dedupe } from "#/lib/dedupe";
import { Weather } from "./types";

const cache = new Map<string, { data: Weather; ts: number }>();
const TTL = 10 * 60 * 1000; // 10분

export const getWeather = (areaNo: string): Promise<Weather> => {
  const hit = cache.get(areaNo);
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data);

  // 캐시가 채워지기 전 동시에 들어온 동일 areaNo 요청은 한 번만 네트워크로 나간다.
  return dedupe(`weather/${areaNo}`, async () => {
    const res = await api.get("/weather/combined", { params: { areaNo } });
    cache.set(areaNo, { data: res.data, ts: Date.now() });
    return res.data;
  });
};