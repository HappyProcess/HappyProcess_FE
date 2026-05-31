'use client'

import { getCachedLocations } from "#/lib/cache";
import { type Location, type RiskStatus, type Weather } from "#/service/types";
import { getWeather } from "#/service/weather";
import { getRiskStatus } from "#/service/analysis";
import { useEffect, useRef, useState } from "react";
import { ConditionIcon, RecommandIcon, WeatherIcon } from "@/components";
import {
  getLocationTitle,
  getStoredLocationType,
  LOCATION_TYPE_CHANGED_EVENT,
  saveSelectedLocationType,
  type SelectedLocationType,
} from "@/constants/locationSelection";

const weatherIconIndex: Record<string, [number, number]> = {
  "맑음": [0, 1],
  "구름많음": [4, 5],
  "흐림": [6, 6],
  "비": [8, 8],
  "비/눈": [13, 13],
  "눈": [11, 11],
};

const gradeLabel: Record<string, string> = { "1": "좋음", "2": "보통", "3": "나쁨", "4": "매우나쁨" };
const gradeTone: Record<string, string> = {
  "1": "text-[#2f80ed]",
  "2": "text-[#24a148]",
  "3": "text-red-500",
  "4": "text-red-500",
};
const gradeAccent: Record<string, string> = {
  "1": "bg-[#2f80ed]",
  "2": "bg-[#24a148]",
  "3": "bg-red-500",
  "4": "bg-red-500",
};

const pollenLabel: Record<string, string> = {
  "0": "낮음",
  "1": "낮음",
  "2": "보통",
  "3": "높음",
  "4": "매우높음",
};

const getWeatherIconIndex = (condition: string) => {
  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const pair = weatherIconIndex[condition] ?? [0, 0];
  return isDay ? pair[0] : pair[1];
};

const getUvLabel = (level: string) => {
  const value = Number(level);
  if (Number.isNaN(value)) return "-";
  if (value <= 2) return "낮음";
  if (value <= 5) return "보통";
  if (value <= 7) return "높음";
  if (value <= 10) return "매우높음";
  return "위험";
};

const getUvTone = (level: string) => {
  const value = Number(level);
  if (Number.isNaN(value)) return "text-[#7a7a7a]";
  if (value <= 2) return "text-[#2f80ed]";
  if (value <= 5) return "text-[#24a148]";
  return "text-red-500";
};

const getUvAccent = (level: string) => {
  const value = Number(level);
  if (Number.isNaN(value)) return "bg-[#d1d1d6]";
  if (value <= 2) return "bg-[#2f80ed]";
  if (value <= 5) return "bg-[#24a148]";
  return "bg-red-500";
};

const getPollenTone = (level: string) => {
  if (level === "0" || level === "1") return "text-[#2f80ed]";
  if (level === "2") return "text-[#24a148]";
  if (level === "3" || level === "4") return "text-red-500";
  return "text-[#7a7a7a]";
};

const getPollenAccent = (level: string) => {
  if (level === "0" || level === "1") return "bg-[#2f80ed]";
  if (level === "2") return "bg-[#24a148]";
  if (level === "3" || level === "4") return "bg-red-500";
  return "bg-[#d1d1d6]";
};

export default function Home() {
  const [locations, setLocations] = useState<{ home?: Location; work?: Location }>({});
  const [weathers, setWeathers] = useState<{ home?: Weather; work?: Weather }>({});
  const [loading, setLoading] = useState(true);
  const [locType, setLocType] = useState<SelectedLocationType>(() => getStoredLocationType());
  const [riskState, setRiskState] = useState<{
    locationType: SelectedLocationType | null;
    status: RiskStatus | null;
    hasError: boolean;
  }>({
    locationType: null,
    status: null,
    hasError: false,
  });

  useEffect(() => {
    const handleLocationChanged = (event: Event) => {
      const { locationType } = (event as CustomEvent<{
        locationType: SelectedLocationType;
      }>).detail;
      setLocType(locationType);
    };

    window.addEventListener(LOCATION_TYPE_CHANGED_EVENT, handleLocationChanged);
    return () => window.removeEventListener(LOCATION_TYPE_CHANGED_EVENT, handleLocationChanged);
  }, []);

  useEffect(() => {
    getCachedLocations().then((list) => {
      const home = list.find((location) => location.locationType === "HOME");
      const work = list.find((location) => location.locationType === "WORK");
      setLocations({ home, work });

      if (locType === "WORK" && !work && home) {
        saveSelectedLocationType("HOME");
      }

      const fetches = [
        home ? getWeather(home.areaNo).then((weather) => ({ type: "home", weather })) : null,
        work ? getWeather(work.areaNo).then((weather) => ({ type: "work", weather })) : null,
      ].filter(Boolean) as Promise<{ type: string; weather: Weather }>[];

      Promise.all(fetches)
        .then((results) => {
          const next: { home?: Weather; work?: Weather } = {};
          results.forEach(({ type, weather }) => {
            next[type as "home" | "work"] = weather;
          });
          setWeathers(next);
        })
        .finally(() => setLoading(false));
    });
  }, [locType]);

  useEffect(() => {
    let canceled = false;

    getRiskStatus(locType)
      .then((data) => {
        if (!canceled) {
          setRiskState({ locationType: locType, status: data, hasError: false });
        }
      })
      .catch(() => {
        if (!canceled) {
          setRiskState({ locationType: locType, status: null, hasError: true });
        }
      });

    return () => {
      canceled = true;
    };
  }, [locType]);

  const weather = locType === "HOME" ? weathers.home : weathers.work;
  const riskLoading = riskState.locationType !== locType;
  const selectedLocation = locType === "HOME" ? locations.home : locations.work;
  const selectLocation = (nextType: SelectedLocationType) => {
    setLocType(nextType);
    saveSelectedLocationType(nextType);
  };

  return (
    <div className="flex flex-col bg-white px-5 pb-8">
      <main className="flex flex-col gap-4 pt-1">
        <HomeLocationSection
          selectedLocation={selectedLocation}
          locations={locations}
          locationType={locType}
          onChange={selectLocation}
        />

        <RiskStatusSection
          status={riskState.status}
          loading={riskLoading}
          hasError={riskState.hasError}
          locationType={locType}
        />

        <section className="rounded-[14px] border border-[#e0e0e0] bg-white p-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded-[12px] bg-[#f5f5f7]" />
          ) : (
            <div className="flex items-center justify-center gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#fff8dc]">
                <WeatherIcon
                  index={getWeatherIconIndex(weather?.weatherCondition ?? "")}
                  scale={0.72}
                  isOnlyIcon
                />
              </div>
              <div className="min-w-0 text-center">
                <p className="text-[18px] font-normal leading-none tracking-[-0.374px] text-[#1d1d1f]">
                  {weather?.weatherCondition ?? "날씨 정보 없음"}
                </p>
                <p className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.28px] text-[#000] max-[360px]:text-[44px]">
                  {weather?.temperature ?? "--"}°
                </p>
                <p className="mt-1 text-[14px] font-normal leading-[1.24] tracking-[-0.224px] text-[#1d1d1f]">
                  체감 {weather?.temperature ?? "--"} |{" "}
                  <span className="text-[#0066cc]">
                    습도 {weather?.humidity ?? "--"}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-2">
          <AirQualityCard
            title="미세먼지"
            sub="PM10"
            label={gradeLabel[weather?.pm10Grade ?? ""] ?? "-"}
            value={weather?.pm10Value ? `${weather.pm10Value} ㎍/㎥` : "-"}
            tone={gradeTone[weather?.pm10Grade ?? ""] ?? "text-[#7a7a7a]"}
            accent={gradeAccent[weather?.pm10Grade ?? ""] ?? "bg-[#d1d1d6]"}
            iconIndex={weather?.pm10Grade === "1" || weather?.pm10Grade === "2" ? 0 : 1}
          />
          <AirQualityCard
            title="초미세먼지"
            sub="PM2.5"
            label={gradeLabel[weather?.pm25Grade ?? ""] ?? "-"}
            value={weather?.pm25Value ? `${weather.pm25Value} ㎍/㎥` : "-"}
            tone={gradeTone[weather?.pm25Grade ?? ""] ?? "text-[#7a7a7a]"}
            accent={gradeAccent[weather?.pm25Grade ?? ""] ?? "bg-[#d1d1d6]"}
            iconIndex={weather?.pm25Grade === "1" || weather?.pm25Grade === "2" ? 0 : 1}
          />
          <AirQualityCard
            title="자외선"
            sub="UV"
            label={getUvLabel(weather?.uvRiskLevel ?? "")}
            value={weather?.uvRiskLevel ? `${weather.uvRiskLevel} ${getUvLabel(weather.uvRiskLevel)}` : "-"}
            tone={getUvTone(weather?.uvRiskLevel ?? "")}
            accent={getUvAccent(weather?.uvRiskLevel ?? "")}
            iconIndex={Number(weather?.uvRiskLevel ?? 0) <= 5 ? 0 : 1}
          />
          <AirQualityCard
            title="꽃가루"
            sub="Pollen"
            label={pollenLabel[weather?.pollenRiskLevel ?? ""] ?? "-"}
            value="위험도"
            tone={getPollenTone(weather?.pollenRiskLevel ?? "")}
            accent={getPollenAccent(weather?.pollenRiskLevel ?? "")}
            iconIndex={
              weather?.pollenRiskLevel === "3" || weather?.pollenRiskLevel === "4" ? 1 : 0
            }
          />
        </section>

        <TodayRecommendationSection
          status={riskState.status}
          loading={riskLoading}
          locationType={locType}
        />

      </main>

      <footer className="mt-6 border-t border-[#1d1d1f] pt-4 text-center">
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

const recommendationIconIndex: Record<string, number> = {
  "미세먼지": 0,
  "초미세먼지": 0,
  "꽃가루": 0,
  "자외선": 3,
  "습도": 1,
  "기온": 2,
  "온도": 2,
};

const getRecommendationIconIndex = (factorName: string) => {
  const matched = Object.entries(recommendationIconIndex).find(([keyword]) =>
    factorName.includes(keyword)
  );
  return matched?.[1] ?? 3;
};

const getRecommendationTitle = (factorName: string, guide: string) => {
  if (factorName.includes("미세먼지") || factorName.includes("꽃가루")) return "마스크 착용";
  if (factorName.includes("자외선")) return "자외선 차단";
  if (factorName.includes("습도")) return "습도 조절";
  const firstSentence = guide.split(/[.!?。]/)[0]?.trim();
  return firstSentence && firstSentence.length <= 12 ? firstSentence : factorName;
};

function HomeLocationSection({
  selectedLocation,
  locations,
  locationType,
  onChange,
}: {
  selectedLocation?: Location;
  locations: { home?: Location; work?: Location };
  locationType: SelectedLocationType;
  onChange: (locationType: SelectedLocationType) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold leading-tight tracking-[-0.12px] text-[#7a7a7a]">
            {locationType === "HOME" ? "거주지역" : "직장/학교"}
          </p>
          <p className="mt-1 truncate text-[20px] font-semibold leading-tight tracking-[-0.374px] text-[#1d1d1f]">
            {getLocationTitle(selectedLocation)}
          </p>
        </div>
        {(locations.home || locations.work) && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f7] p-0.5">
            {locations.home && (
              <button
                type="button"
                onClick={() => onChange("HOME")}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold tracking-[-0.12px] transition-colors active:scale-95 ${
                  locationType === "HOME" ? "bg-white text-[#1d1d1f]" : "text-[#7a7a7a]"
                }`}
              >
                거주지역
              </button>
            )}
            {locations.work && (
              <button
                type="button"
                onClick={() => onChange("WORK")}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold tracking-[-0.12px] transition-colors active:scale-95 ${
                  locationType === "WORK" ? "bg-white text-[#1d1d1f]" : "text-[#7a7a7a]"
                }`}
              >
                직장/학교
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TodayRecommendationSection({
  status,
  loading,
  locationType,
}: {
  status: RiskStatus | null;
  loading: boolean;
  locationType: SelectedLocationType;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [slideReady, setSlideReady] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  const recommendations =
    status?.riskDetails?.flatMap((detail) =>
      detail.factorGuides.map((factorGuide) => ({
        diseaseId: detail.diseaseId,
        diseaseName: detail.diseaseName,
        factorName: factorGuide.factorName,
        guide: factorGuide.guide,
      }))
    ) ?? [];
  const locationLabel = locationType === "HOME" ? "거주지역" : "직장/학교";
  const safeIndex =
    recommendations.length > 0 ? Math.min(activeIndex, recommendations.length - 1) : 0;
  const activeRecommendation = recommendations[safeIndex];
  const hasMultipleRecommendations = recommendations.length > 1;
  const startSlide = (direction: "next" | "prev", nextIndex: number) => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    setSlideDirection(direction);
    setSlideReady(false);
    setActiveIndex(nextIndex);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setSlideReady(true);
      animationFrameRef.current = null;
    });
  };
  const moveRecommendation = (direction: -1 | 1) => {
    if (recommendations.length === 0) return;
    const nextIndex = (safeIndex + direction + recommendations.length) % recommendations.length;
    startSlide(direction === 1 ? "next" : "prev", nextIndex);
  };
  const selectRecommendation = (index: number) => {
    if (index === safeIndex) return;
    startSlide(index > safeIndex ? "next" : "prev", index);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#48c8d8] text-[18px] font-semibold leading-none text-[#0066cc]">
          ✓
        </span>
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.374px] text-[#1d1d1f]">
          오늘의 행동 요령
        </h2>
      </div>

      {loading ? (
        <div className="min-h-[184px] rounded-[12px] border border-[#e0e0e0] p-4">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-[12px] bg-[#f5f5f7]" />
          <div className="mx-auto mt-4 h-5 w-24 animate-pulse rounded bg-[#f5f5f7]" />
          <div className="mx-auto mt-3 h-4 w-full animate-pulse rounded bg-[#f5f5f7]" />
          <div className="mx-auto mt-2 h-4 w-5/6 animate-pulse rounded bg-[#f5f5f7]" />
        </div>
      ) : recommendations.length > 0 ? (
        <div>
          <div className="relative">
            <div className="min-h-[196px] overflow-hidden rounded-[18px] border border-[#e0e0e0] bg-white">
              <div
                key={`${activeRecommendation.diseaseId}-${activeRecommendation.factorName}-${safeIndex}`}
                className={`flex min-h-[196px] flex-col px-12 py-5 transition-all duration-200 ease-out ${
                  slideReady
                    ? "translate-x-0 scale-100 opacity-100"
                    : slideDirection === "next"
                      ? "translate-x-5 scale-[0.98] opacity-0"
                      : "-translate-x-5 scale-[0.98] opacity-0"
                }`}
              >
                <div className="mx-auto grid h-16 w-20 place-items-center rounded-[8px] bg-[#f5f5f7]">
                  <RecommandIcon
                    index={getRecommendationIconIndex(activeRecommendation.factorName)}
                    scale={0.17}
                  />
                </div>
                <p className="mt-3 text-center text-[13px] font-semibold leading-tight tracking-[-0.12px] text-[#7a7a7a]">
                  {activeRecommendation.diseaseName} · {activeRecommendation.factorName}
                </p>
                <p className="mt-1 text-center text-[16px] font-semibold leading-tight tracking-[-0.224px] text-[#1d1d1f]">
                  {getRecommendationTitle(activeRecommendation.factorName, activeRecommendation.guide)}
                </p>
                <p className="mt-3 break-keep text-center text-[13px] font-medium leading-[1.45] tracking-[-0.12px] text-[#3a3a3c]">
                  {activeRecommendation.guide}
                </p>
              </div>
            </div>
            {hasMultipleRecommendations && (
              <>
                <button
                  type="button"
                  onClick={() => moveRecommendation(-1)}
                  className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#d2d2d7]/70 text-[30px] font-normal leading-none text-[#1d1d1f] backdrop-blur active:scale-95 focus:outline-2 focus:outline-[#0071e3]"
                  aria-label="이전 추천"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => moveRecommendation(1)}
                  className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#d2d2d7]/70 text-[30px] font-normal leading-none text-[#1d1d1f] backdrop-blur active:scale-95 focus:outline-2 focus:outline-[#0071e3]"
                  aria-label="다음 추천"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {hasMultipleRecommendations && (
            <div className="mt-2 flex justify-center gap-1.5">
              {recommendations.map((recommendation, index) => (
                <button
                  key={`${recommendation.diseaseId}-${recommendation.factorName}-${index}-dot`}
                  type="button"
                  onClick={() => selectRecommendation(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === safeIndex ? "w-4 bg-[#1d1d1f]" : "w-1.5 bg-[#d1d1d6]"
                  }`}
                  aria-label={`${index + 1}번째 추천`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-[#e0e0e0] bg-white p-4 text-center">
          <p className="text-[14px] font-semibold leading-[1.35] tracking-[-0.224px] text-[#1d1d1f]">
            {locationLabel} 기준으로 추가 행동 요령이 없어요.
          </p>
        </div>
      )}
    </section>
  );
}

function RiskStatusSection({
  status,
  loading,
  hasError,
  locationType,
}: {
  status: RiskStatus | null;
  loading: boolean;
  hasError: boolean;
  locationType: SelectedLocationType;
}) {
  const locationLabel = locationType === "HOME" ? "거주지역" : "직장/학교";

  if (loading) {
    return (
      <section className="rounded-[14px] border border-[#e0e0e0] bg-white p-3">
        <div className="grid grid-cols-[84px_1fr_40px] items-center gap-3 max-[360px]:grid-cols-[72px_1fr_34px]">
          <div className="h-[78px] w-[78px] animate-pulse bg-[#f5f5f7] max-[360px]:h-[66px] max-[360px]:w-[66px]" />
          <div className="min-w-0 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-[#f5f5f7]" />
            <div className="h-7 w-20 animate-pulse rounded bg-[#f5f5f7]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#f5f5f7]" />
          </div>
        </div>
      </section>
    );
  }

  if (hasError) {
    return (
      <section className="rounded-[14px] border border-[#e0e0e0] bg-white p-3">
        <div className="grid grid-cols-[84px_1fr_40px] items-center gap-3 max-[360px]:grid-cols-[72px_1fr_34px]">
          <div className="grid h-[78px] w-[78px] place-items-center bg-[#f5f5f7] max-[360px]:h-[66px] max-[360px]:w-[66px]">
            <span className="text-[28px] leading-none text-[#7a7a7a]">!</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
              위험도 확인 불가
            </p>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-[1.35] tracking-[-0.224px] text-[#7a7a7a] max-[360px]:text-[12px]">
              {locationLabel} 기준 분석 정보를 잠시 후 다시 확인해 주세요.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!status?.isRisk) {
    return (
      <section className="rounded-[14px] border border-[#b7e3c0] bg-[#f1fbf3] p-3">
        <div className="grid grid-cols-[84px_1fr_40px] items-center gap-3 max-[360px]:grid-cols-[72px_1fr_34px]">
          <div className="grid h-[78px] w-[78px] place-items-center bg-white max-[360px]:h-[66px] max-[360px]:w-[66px]">
            <ConditionIcon index={0} scale={0.18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
              외출 전 체크
            </p>
            <p className="mt-1 text-[26px] font-semibold leading-[1.1] tracking-[-0.374px] text-[#24a148]">
              양호
            </p>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-[1.35] tracking-[-0.224px] text-[#1d1d1f] max-[360px]:text-[12px]">
              현재 추가 주의 요인이 없어요.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[14px] border border-[#ff8a8a] bg-[#fff1f1] p-3">
      <div className="grid grid-cols-[84px_1fr_40px] items-center gap-3 max-[360px]:grid-cols-[72px_1fr_34px]">
        <div className="grid h-[78px] w-[78px] place-items-center bg-white max-[360px]:h-[66px] max-[360px]:w-[66px]">
          <ConditionIcon index={1} scale={0.18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
            외출 전 체크
          </p>
          <p className="mt-1 text-[26px] font-semibold leading-[1.1] tracking-[-0.374px] text-red-500">
            주의 필요
          </p>
          <p className="mt-2 break-keep text-[14px] font-semibold leading-[1.35] tracking-[-0.224px] text-[#1d1d1f] max-[360px]:text-[12px]">
            아래 행동요령을 참고해 주세요.
          </p>
        </div>
        <WarningTriangle />
      </div>
    </section>
  );
}

function WarningTriangle() {
  return (
    <div className="relative h-10 w-10">
      <div className="absolute inset-x-0 top-0 mx-auto h-0 w-0 border-x-[20px] border-b-[38px] border-x-transparent border-b-red-400" />
      <span className="absolute left-1/2 top-[9px] -translate-x-1/2 text-[22px] font-semibold leading-none text-white">
        !
      </span>
    </div>
  );
}

function AirQualityCard({
  title,
  sub,
  label,
  value,
  tone,
  accent,
  iconIndex,
}: {
  title: string;
  sub: string;
  label: string;
  value: string;
  tone: string;
  accent: string;
  iconIndex: number;
}) {
  return (
    <div className="relative flex min-h-[118px] flex-col rounded-[12px] border border-[#e0e0e0] bg-white p-2.5">
      <div className={`absolute left-0 top-0 h-1 w-1/2 rounded-tl-[12px] ${accent}`} />
      <p className="text-[12px] font-semibold leading-tight tracking-[-0.12px] text-[#1d1d1f]">
        {title}
        <span className="text-[9px] tracking-[-0.08px]">({sub})</span>
      </p>
      <p className={`mt-4 text-[20px] font-semibold leading-none tracking-[-0.224px] ${tone}`}>
        {label}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2">
        <span className="text-[11px] font-semibold leading-tight tracking-[-0.12px] text-[#1d1d1f]">
          {value}
        </span>
        <ConditionIcon index={iconIndex} scale={0.16} />
      </div>
    </div>
  );
}
