'use client'
import Image from "next/image";

import { getCachedLocations } from "#/lib/cache";
import { type Location, type RiskStatus, type Weather } from "#/service/types";
import { getWeather } from "#/service/weather";
import { getRiskStatus } from "#/service/analysis";
import { useEffect, useRef, useState } from "react";
import { RecommandIcon, WeatherIcon } from "@/components";
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

// 대기질 카드도 점수 카드와 동일 체계: 좋음=파랑 / 보통=주황 / 나쁨=빨강 + 무드 얼굴 3종.
type AirLevel = "good" | "normal" | "bad" | "none";
const AIR_STYLE: Record<AirLevel, { color: string; mood: "bad" | "neutral" | "good" }> = {
  good: { color: "#3182f6", mood: "good" },
  normal: { color: "#fe9800", mood: "neutral" },
  bad: { color: "#f04452", mood: "bad" },
  none: { color: "#b0b8c1", mood: "neutral" },
};
const pmLevel = (grade: string): AirLevel =>
  grade === "1" ? "good" : grade === "2" ? "normal" : grade === "3" || grade === "4" ? "bad" : "none";

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

const uvLevel = (level: string): AirLevel => {
  const value = Number(level);
  if (Number.isNaN(value)) return "none";
  if (value <= 2) return "good";
  if (value <= 5) return "normal";
  return "bad";
};

const pollenLevel = (level: string): AirLevel =>
  level === "0" || level === "1" ? "good" : level === "2" ? "normal" : level === "3" || level === "4" ? "bad" : "none";

export default function Home() {
  const [locations, setLocations] = useState<{ home?: Location; work?: Location }>({});
  const [weathers, setWeathers] = useState<{ home?: Weather; work?: Weather }>({});
  const [loading, setLoading] = useState(true);
  // SSR/CSR 일치를 위해 초기값은 고정("HOME"), 저장된 값은 마운트 후 반영(아래 effect)
  const [locType, setLocType] = useState<SelectedLocationType>("HOME");
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
    // 마운트 후 저장된 선택 지역 반영 (hydration mismatch 방지)
    setLocType(getStoredLocationType());

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
    let canceled = false;

    getCachedLocations()
      .then((list) => {
        if (canceled) return;
        const home = list.find((location) => location.locationType === "HOME");
        const work = list.find((location) => location.locationType === "WORK");
        setLocations({ home, work });

        if (locType === "WORK" && !work && home) {
          saveSelectedLocationType("HOME");
        }

        // 선택된 지역을 우선 처리해, 날씨가 도착하는 즉시 그 지역부터 렌더한다.
        // (home/work를 Promise.all로 묶지 않아 느린 한쪽이 빠른 쪽을 막지 않음)
        const selected = locType === "WORK" ? "work" : "home";
        const targets: { type: "home" | "work"; areaNo: string }[] = [];
        if (home) targets.push({ type: "home", areaNo: home.areaNo });
        if (work) targets.push({ type: "work", areaNo: work.areaNo });
        targets.sort((a) => (a.type === selected ? -1 : 1));

        if (targets.length === 0) {
          setLoading(false);
          return;
        }

        targets.forEach(({ type, areaNo }) => {
          getWeather(areaNo)
            .then((weather) => {
              if (canceled) return;
              setWeathers((prev) => ({ ...prev, [type]: weather }));
            })
            // 개별 지역 날씨 실패는 무시 — 해당 카드만 비고 앱은 계속 동작
            .catch(() => {})
            .finally(() => {
              // 선택된 지역의 날씨가 끝나면 곧바로 로딩 해제 — 나머지는 백그라운드로.
              if (!canceled && type === selected) setLoading(false);
            });
        });
      })
      // 위치 조회 실패(예: 미인증 403) 시 unhandledRejection을 막는다.
      // (dev 에러 오버레이가 스택 심볼화를 반복 요청하는 부작용 방지)
      .catch(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
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
    <div className="flex flex-col bg-[#f2f4f6] px-5 pb-8">
      <main className="flex flex-col gap-3 pt-2">
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

        <section className="rounded-[20px] bg-white p-5">
          {loading ? (
            <div className="h-24 animate-pulse rounded-xl bg-[#f2f4f6]" />
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
                <p className="text-[15px] font-medium leading-none text-[#4e5968]">
                  {weather?.weatherCondition ?? "날씨 정보 없음"}
                </p>
                <p className="mt-2 text-[52px] font-bold leading-none tracking-[-0.02em] text-[#191f28] max-[360px]:text-[44px]">
                  {weather?.temperature ?? "--"}°
                </p>
                <p className="mt-2 text-[14px] font-medium leading-[1.24] text-[#8b95a1]">
                  체감 {weather?.temperature ?? "--"} |{" "}
                  <span className="text-[#3182f6]">
                    습도 {weather?.humidity ?? "--"}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-2.5">
          <AirQualityCard
            title="미세먼지"
            sub="PM10"
            label={gradeLabel[weather?.pm10Grade ?? ""] ?? "-"}
            value={weather?.pm10Value ? `${weather.pm10Value} ㎍/㎥` : "-"}
            level={pmLevel(weather?.pm10Grade ?? "")}
          />
          <AirQualityCard
            title="초미세먼지"
            sub="PM2.5"
            label={gradeLabel[weather?.pm25Grade ?? ""] ?? "-"}
            value={weather?.pm25Value ? `${weather.pm25Value} ㎍/㎥` : "-"}
            level={pmLevel(weather?.pm25Grade ?? "")}
          />
          <AirQualityCard
            title="자외선"
            sub="UV"
            label={getUvLabel(weather?.uvRiskLevel ?? "")}
            value={weather?.uvRiskLevel ? `${weather.uvRiskLevel} ${getUvLabel(weather.uvRiskLevel)}` : "-"}
            level={uvLevel(weather?.uvRiskLevel ?? "")}
          />
          <AirQualityCard
            title="꽃가루"
            sub="Pollen"
            label={pollenLabel[weather?.pollenRiskLevel ?? ""] ?? "-"}
            value="위험도"
            level={pollenLevel(weather?.pollenRiskLevel ?? "")}
          />
        </section>

        <TodayRecommendationSection
          status={riskState.status}
          loading={riskLoading}
          locationType={locType}
        />

      </main>

      <footer className="mt-8 border-t border-[#e5e8eb] pt-5 text-center">
        <Image src="/logo.png" alt="Happy Process" width={149} height={38} className="mx-auto" />
        <p className="mt-3 text-[11px] font-medium leading-[1.4] text-[#8b95a1]">
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
  const hasToggle = Boolean(locations.home || locations.work);

  return (
    <section className="flex min-h-[60px] items-center justify-between gap-3">
      <div className="min-w-0">
        {!hasToggle && (
          <p className="mb-1 text-[13px] font-semibold leading-tight tracking-[-0.01em] text-[#8b95a1]">
            {locationType === "HOME" ? "거주지역" : "직장/학교"}
          </p>
        )}
        <p className="line-clamp-2 text-[22px] font-bold leading-[1.3] tracking-[-0.02em] text-[#191f28] break-keep">
          {getLocationTitle(selectedLocation)}
        </p>
      </div>
      {hasToggle && (
        <div className="flex shrink-0 items-center gap-0.5 rounded-[10px] bg-[#e5e8eb] p-1">
          {locations.home && (
            <button
              type="button"
              onClick={() => onChange("HOME")}
              className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                locationType === "HOME"
                  ? "bg-white text-[#191f28] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                  : "text-[#8b95a1]"
              }`}
            >
              거주지역
            </button>
          )}
          {locations.work && (
            <button
              type="button"
              onClick={() => onChange("WORK")}
              className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                locationType === "WORK"
                  ? "bg-white text-[#191f28] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                  : "text-[#8b95a1]"
              }`}
            >
              직장/학교
            </button>
          )}
        </div>
      )}
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
      <div className="mb-3 mt-1 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3182f6] text-[15px] font-bold leading-none text-white">
          ✓
        </span>
        <h2 className="text-[20px] font-bold leading-tight tracking-[-0.02em] text-[#191f28]">
          오늘의 행동 요령
        </h2>
      </div>

      {loading ? (
        <div className="h-64 rounded-[20px] bg-white p-4">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-xl bg-[#f2f4f6]" />
          <div className="mx-auto mt-4 h-5 w-24 animate-pulse rounded bg-[#f2f4f6]" />
          <div className="mx-auto mt-3 h-4 w-full animate-pulse rounded bg-[#f2f4f6]" />
          <div className="mx-auto mt-2 h-4 w-5/6 animate-pulse rounded bg-[#f2f4f6]" />
        </div>
      ) : recommendations.length > 0 ? (
        <div>
          <div className="relative">
            <div className="h-64 overflow-hidden rounded-[20px] bg-white">
              <div
                key={`${activeRecommendation.diseaseId}-${activeRecommendation.factorName}-${safeIndex}`}
                className={`flex h-64 flex-col justify-center px-12 py-5 transition-all duration-200 ease-out ${
                  slideReady
                    ? "translate-x-0 scale-100 opacity-100"
                    : slideDirection === "next"
                      ? "translate-x-5 scale-[0.98] opacity-0"
                      : "-translate-x-5 scale-[0.98] opacity-0"
                }`}
              >
                <div className="mx-auto grid h-16 w-20 place-items-center rounded-xl bg-[#f2f4f6]">
                  <RecommandIcon
                    index={getRecommendationIconIndex(activeRecommendation.factorName)}
                    scale={0.17}
                  />
                </div>
                <p className="mt-3 text-center text-[13px] font-semibold leading-tight text-[#8b95a1]">
                  {activeRecommendation.diseaseName} · {activeRecommendation.factorName}
                </p>
                <p className="mt-1 text-center text-[17px] font-bold leading-tight tracking-[-0.01em] text-[#191f28]">
                  {getRecommendationTitle(activeRecommendation.factorName, activeRecommendation.guide)}
                </p>
                <p className="mt-3 break-keep text-center text-[14px] font-medium leading-[1.5] text-[#4e5968]">
                  {activeRecommendation.guide}
                </p>
              </div>
            </div>
            {hasMultipleRecommendations && (
              <>
                <button
                  type="button"
                  onClick={() => moveRecommendation(-1)}
                  className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[26px] font-normal leading-none text-[#4e5968] shadow-[0_1px_4px_rgba(0,0,0,0.1)] backdrop-blur active:scale-95 focus:outline-2 focus:outline-[#3182f6]"
                  aria-label="이전 추천"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => moveRecommendation(1)}
                  className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[26px] font-normal leading-none text-[#4e5968] shadow-[0_1px_4px_rgba(0,0,0,0.1)] backdrop-blur active:scale-95 focus:outline-2 focus:outline-[#3182f6]"
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
                    index === safeIndex ? "w-4 bg-[#3182f6]" : "w-1.5 bg-[#d1d6db]"
                  }`}
                  aria-label={`${index + 1}번째 추천`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] bg-white p-5 text-center">
          <p className="text-[15px] font-semibold leading-[1.4] text-[#4e5968]">
            {locationLabel} 기준으로 추가 행동 요령이 없어요.
          </p>
        </div>
      )}
    </section>
  );
}

// 날씨 점수: 0~100, 낮을수록 나쁨.
// 0~40 나쁨(빨강) / 41~70 보통(회색) / 71~100 좋음(파랑)
type Mood = "bad" | "neutral" | "good";
type ScoreGrade = {
  label: string;
  status: string;
  desc: string;
  color: string;
  bg: string;
  badge: string;
  mood: Mood;
};

const getScoreGrade = (score: number): ScoreGrade => {
  if (score <= 40)
    return {
      label: "나쁨",
      status: "주의 필요",
      desc: "외출 시 주의가 필요해요.",
      color: "#f04452",
      bg: "#fdecee",
      badge: "rgba(240,68,82,0.12)",
      mood: "bad",
    };
  if (score <= 70)
    return {
      label: "보통",
      status: "보통",
      desc: "활동하기 무난한 날씨예요.",
      color: "#fe9800",
      bg: "#fff4e5",
      badge: "rgba(254,152,0,0.14)",
      mood: "neutral",
    };
  return {
    label: "좋음",
    status: "양호",
    desc: "활동하기 좋은 날이에요.",
    color: "#3182f6",
    bg: "#e8f3ff",
    badge: "rgba(49,130,246,0.12)",
    mood: "good",
  };
};

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

// 점수 등급별 무드 얼굴 (색상 원 + 흰 표정). 나쁨/보통/좋음 3종.
function MoodFace({ mood, color, size = 48 }: { mood: Mood; color: string; size?: number }) {
  const stroke = {
    fill: "none",
    stroke: "#fff",
    strokeWidth: 7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill={color} />
      {mood === "bad" && (
        <>
          <path d="M26 40 L44 46" {...stroke} />
          <path d="M74 40 L56 46" {...stroke} />
          <circle cx="37" cy="54" r="4.5" fill="#fff" />
          <circle cx="63" cy="54" r="4.5" fill="#fff" />
          <path d="M34 72 Q50 60 66 72" {...stroke} />
        </>
      )}
      {mood === "neutral" && (
        <>
          <circle cx="37" cy="46" r="5" fill="#fff" />
          <circle cx="63" cy="46" r="5" fill="#fff" />
          <path d="M36 64 L64 64" {...stroke} />
        </>
      )}
      {mood === "good" && (
        <>
          <path d="M26 44 L44 38" {...stroke} />
          <path d="M74 44 L56 38" {...stroke} />
          <circle cx="37" cy="52" r="4.5" fill="#fff" />
          <circle cx="63" cy="52" r="4.5" fill="#fff" />
          <path d="M34 60 Q50 76 66 60" {...stroke} />
        </>
      )}
    </svg>
  );
}

function WeatherScoreRow({ name, score }: { name: string; score: number }) {
  const grade = getScoreGrade(score);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: grade.color }}
        />
        <span className="truncate text-[15px] font-semibold leading-tight text-[#191f28]">
          {name}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[20px] font-bold leading-none tabular-nums" style={{ color: grade.color }}>
          {score}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[12px] font-bold leading-none"
          style={{ backgroundColor: grade.badge, color: grade.color }}
        >
          {grade.label}
        </span>
      </div>
    </div>
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const locationLabel = locationType === "HOME" ? "거주지역" : "직장/학교";

  if (loading) {
    return (
      <section className="rounded-[20px] bg-white p-4">
        <div className="grid grid-cols-[84px_1fr] items-center gap-4 max-[360px]:grid-cols-[72px_1fr]">
          <div className="h-19.5 w-19.5 animate-pulse rounded-[20px] bg-[#f2f4f6] max-[360px]:h-16.5 max-[360px]:w-16.5" />
          <div className="min-w-0 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-[#f2f4f6]" />
            <div className="h-7 w-20 animate-pulse rounded bg-[#f2f4f6]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#f2f4f6]" />
          </div>
        </div>
      </section>
    );
  }

  if (hasError) {
    return (
      <section className="rounded-[20px] bg-white p-4">
        <div className="grid grid-cols-[84px_1fr] items-center gap-4 max-[360px]:grid-cols-[72px_1fr]">
          <div className="grid h-19.5 w-19.5 place-items-center rounded-[20px] bg-[#f2f4f6] max-[360px]:h-16.5 max-[360px]:w-16.5">
            <span className="text-[28px] leading-none text-[#8b95a1]">!</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-[#191f28]">
              위험도 확인 불가
            </p>
            <p className="mt-2 break-keep text-[14px] font-medium leading-[1.4] text-[#8b95a1] max-[360px]:text-[12px]">
              {locationLabel} 기준 분석 정보를 잠시 후 다시 확인해 주세요.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isRisk = !!status?.isRisk;
  // 모든 질환이 항상 담김(질환 없으면 질병없음 1건). 점수 오름차순 = 나쁜 순.
  const details = (status?.riskDetails ?? [])
    .filter((detail) => typeof detail.weatherScore === "number")
    .map((detail) => ({ ...detail, score: clampScore(detail.weatherScore) }))
    .sort((a, b) => a.score - b.score);
  // 보통 이하(≤70)만 리스트로 노출, 나머지(좋음)는 전체 보기 시트에서.
  const attentionScores = details.filter((detail) => detail.score <= 70);
  const hasMore = details.length > attentionScores.length;
  // 카드 전체 분위기는 가장 나쁜(최저) 점수 기준. 점수 없으면 isRisk로 대체.
  const grade = getScoreGrade(details[0]?.score ?? (isRisk ? 0 : 100));

  return (
    <section className="rounded-[20px] p-4" style={{ backgroundColor: grade.bg }}>
      <div className="grid grid-cols-[84px_1fr] items-center gap-4 max-[360px]:grid-cols-[72px_1fr]">
        <div className="grid h-19.5 w-19.5 place-items-center rounded-[20px] bg-white max-[360px]:h-16.5 max-[360px]:w-16.5">
          <MoodFace mood={grade.mood} color={grade.color} size={44} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-[#8b95a1]">
            오늘의 날씨 점수
          </p>
          <p
            className="mt-1 text-[26px] font-bold leading-[1.1] tracking-[-0.02em]"
            style={{ color: grade.color }}
          >
            {grade.status}
          </p>
        </div>
      </div>

      {details.length > 0 && (
        <div className="mt-3 rounded-[16px] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#191f28]">
              질환별 날씨 점수
            </h3>
            {hasMore && (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="shrink-0 text-[13px] font-semibold text-[#3182f6] transition-transform active:scale-95"
              >
                전체 보기
              </button>
            )}
          </div>
          {attentionScores.length > 0 ? (
            <div className="mt-3 flex flex-col gap-3">
              {attentionScores.map((detail) => (
                <WeatherScoreRow key={detail.diseaseId} name={detail.diseaseName} score={detail.score} />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13px] font-medium leading-[1.4] text-[#8b95a1]">
              점수가 낮은 질환이 없어요. 전체 점수를 확인해 보세요.
            </p>
          )}
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            className="absolute inset-0 bg-[rgba(2,9,19,0.5)] motion-safe:animate-[fadeIn_250ms_ease-out]"
            onClick={() => setSheetOpen(false)}
            aria-label="닫기"
          />
          <div className="relative max-h-[80vh] overflow-y-auto rounded-t-[16px] bg-white px-5 pb-8 pt-5 motion-safe:animate-[sheetUp_250ms_cubic-bezier(0,0,0.2,1)]">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#191f28]">질환별 날씨 점수</h3>
              <button
                className="text-[14px] font-semibold text-[#8b95a1] transition-transform active:scale-95"
                onClick={() => setSheetOpen(false)}
              >
                닫기
              </button>
            </div>
            <p className="mb-4 text-[13px] font-medium leading-[1.4] text-[#8b95a1]">
              점수가 높을수록 오늘 날씨가 건강에 좋아요.
            </p>
            <div className="flex flex-col gap-3">
              {details.map((detail) => (
                <WeatherScoreRow key={detail.diseaseId} name={detail.diseaseName} score={detail.score} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AirQualityCard({
  title,
  sub,
  label,
  value,
  level,
}: {
  title: string;
  sub: string;
  label: string;
  value: string;
  level: AirLevel;
}) {
  const { color, mood } = AIR_STYLE[level];
  return (
    <div className="flex min-h-30 flex-col rounded-[20px] bg-white p-4 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[13px] font-semibold leading-tight text-[#4e5968]">
          {title}
          <span className="ml-0.5 text-[10px] font-medium text-[#b0b8c1]">{sub}</span>
        </p>
      </div>
      <p className="mt-2.5 text-[24px] font-bold leading-none tracking-[-0.02em]" style={{ color }}>
        {label}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <span className="text-[12px] font-medium leading-tight text-[#8b95a1]">
          {value}
        </span>
        <MoodFace mood={mood} color={color} size={32} />
      </div>
    </div>
  );
}
