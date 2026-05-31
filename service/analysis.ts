import { api } from "#/lib/api";
import { type LocationType, type RiskStatus } from "./types";

const cache = new Map<string, { data: RiskStatus; ts: number }>();
const TTL = 10 * 60 * 1000; // 10분

const normalizeRiskStatus = (data: RiskStatus): RiskStatus => ({
  ...data,
  isRisk: data.isRisk ?? data.risk ?? false,
});

export const getRiskStatus = async (locationType?: LocationType): Promise<RiskStatus> => {
  const cacheKey = locationType ?? "DEFAULT";
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const res = await api.get("/analysis/risk-status", {
    params: locationType ? { locationType } : undefined,
  });
  const data = normalizeRiskStatus(res.data);
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
};

export const invalidateRiskStatus = (locationType?: LocationType) => {
  if (locationType) {
    cache.delete(locationType);
    return;
  }
  cache.clear();
};
