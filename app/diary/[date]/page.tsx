'use client'

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getCachedAllConditions, getCachedConditions, getCachedLocations } from "#/lib/cache";
import { deleteDiary, getDiary, upsertDiary } from "#/service/diary";
import { getWeather } from "#/service/weather";
import { type Condition, type DiarySymptom, type DiaryWeatherSnapshot } from "#/service/types";
import { parseError } from "#/lib/parseError";
import { formatDateKo, todayISO } from "#/lib/format";
import { getStoredLocationType, type SelectedLocationType } from "@/constants/locationSelection";

const INTENSITY_LABELS = ["아주 약함", "약함", "보통", "심함", "아주 심함"];

// 오늘 새 일기용 — 등록된 위치(집/직장)의 현재 날씨를 일기 스냅샷 형태로 변환.
const fetchLiveWeathers = async (): Promise<DiaryWeatherSnapshot[]> => {
  const locations = await getCachedLocations().catch(() => []);
  const targets = locations.filter(
    (loc) => loc.locationType === "HOME" || loc.locationType === "WORK"
  );
  const snapshots = await Promise.all(
    targets.map(async (loc) => {
      try {
        const w = await getWeather(loc.areaNo);
        return {
          locationType: loc.locationType,
          regionName: w.regionName,
          temperature: w.temperature,
          humidity: w.humidity,
          weatherCondition: w.weatherCondition,
          pm10Value: w.pm10Value,
          pm10Grade: w.pm10Grade,
          pm25Value: w.pm25Value,
          pm25Grade: w.pm25Grade,
          pollenRiskLevel: w.pollenRiskLevel,
          uvRiskLevel: w.uvRiskLevel,
        } as DiaryWeatherSnapshot;
      } catch {
        return null;
      }
    })
  );
  return snapshots.filter((s): s is DiaryWeatherSnapshot => s !== null);
};

const GRADE_LABEL: Record<string, string> = { "1": "좋음", "2": "보통", "3": "나쁨", "4": "매우나쁨" };
const POLLEN_LABEL: Record<string, string> = {
  "0": "낮음",
  "1": "낮음",
  "2": "보통",
  "3": "높음",
  "4": "매우높음",
};

// 등급 문자열("1"~"4") → 색상. 좋음=파랑, 보통=초록, 나쁨 이상=빨강.
const gradeTone = (grade: string | null | undefined) => {
  if (grade === "1") return "text-[#3182f6]";
  if (grade === "2") return "text-[#00b843]";
  if (grade === "3" || grade === "4") return "text-[#f04452]";
  return "text-[#8b95a1]";
};

const pollenTone = (level: string | null | undefined) => {
  if (level === "0" || level === "1") return "text-[#3182f6]";
  if (level === "2") return "text-[#00b843]";
  if (level === "3" || level === "4") return "text-[#f04452]";
  return "text-[#8b95a1]";
};

const uvLabel = (level: string | null | undefined) => {
  const value = Number(level);
  if (!level || Number.isNaN(value)) return "-";
  if (value <= 2) return "낮음";
  if (value <= 5) return "보통";
  if (value <= 7) return "높음";
  if (value <= 10) return "매우높음";
  return "위험";
};

const uvTone = (level: string | null | undefined) => {
  const value = Number(level);
  if (!level || Number.isNaN(value)) return "text-[#8b95a1]";
  if (value <= 2) return "text-[#3182f6]";
  if (value <= 5) return "text-[#00b843]";
  return "text-[#f04452]";
};

export default function DiaryEditPage() {
  const router = useRouter();
  const params = useParams<{ date: string }>();
  const date = params.date;

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [intensities, setIntensities] = useState<Record<number, number>>({});
  const [memo, setMemo] = useState("");
  const [weathers, setWeathers] = useState<DiaryWeatherSnapshot[]>([]);
  const [weatherLocType, setWeatherLocType] = useState<SelectedLocationType>("HOME");
  const [symptoms, setSymptoms] = useState<DiarySymptom[]>([]);
  // 저장 전(오늘 새 일기) 미리 보여주는 "지금 날씨". 저장 시 서버가 이 시점 날씨를 스냅샷한다.
  const [isLiveWeather, setIsLiveWeather] = useState(false);

  // 오늘 일기만 수정 가능. 과거 일기는 기록된 증상만 보여주는 읽기 전용.
  const editable = date === todayISO();
  const [isExisting, setIsExisting] = useState(false);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [diaryChecking, setDiaryChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  // 질환 목록과 기존 일기 조회가 둘 다 끝나야 폼을 확정 상태로 보여준다.
  // (먼저 빈 폼을 그렸다가 증상/날씨가 뒤늦게 채워지는 깜빡임 방지)
  const loading = conditionsLoading || diaryChecking;

  useEffect(() => {
    let canceled = false;
    // 날짜 전환 시 이전 일기 상태가 잠깐 비치지 않도록 초기화
    setDiaryChecking(true);
    setIsExisting(false);
    setMemo("");
    setWeathers([]);
    setWeatherLocType(getStoredLocationType());
    setIntensities({});
    setSymptoms([]);
    setIsLiveWeather(false);

    const loadConditions = Promise.all([
      getCachedConditions().catch(() => [] as Condition[]),
      getCachedAllConditions().catch(() => [] as Condition[]),
    ]).then(([mine, all]) => {
      // 내 보유질환 먼저, 나머지 전체 질환 이어붙임(중복 제거)
      const mineList = mine ?? [];
      const allList = all ?? [];
      const seen = new Set(mineList.map((c) => c.conditionId));
      return [...mineList, ...allList.filter((c) => !seen.has(c.conditionId))];
    });

    // 질환 목록(메인 콘텐츠)이 오면 즉시 폼을 렌더하고, 일기 존재 체크는 도착하는 대로 채운다.
    loadConditions.then((conditionList) => {
      if (canceled) return;
      setConditions(conditionList);
      setConditionsLoading(false);
    });

    getDiary(date)
      .then((diary) => {
        if (canceled) return;
        setIsExisting(true);
        setMemo(diary.memo ?? "");
        setWeathers(diary.weathers ?? []);
        setSymptoms(diary.symptoms ?? []);
        setIntensities(
          Object.fromEntries(diary.symptoms.map((s) => [s.conditionId, s.intensity]))
        );
      })
      // 미작성 날짜는 404(DIARY_NOT_FOUND). 오늘이면 "지금 날씨"를 미리 보여준다.
      // (저장 시 서버가 이 시점 날씨를 스냅샷하므로, 화면의 날씨 == 저장될 날씨)
      .catch(async () => {
        if (canceled || date !== todayISO()) return;
        const live = await fetchLiveWeathers();
        if (canceled) return;
        setWeathers(live);
        setIsLiveWeather(true);
      })
      .finally(() => {
        if (!canceled) setDiaryChecking(false);
      });

    return () => {
      canceled = true;
    };
  }, [date]);

  const selectedCount = Object.keys(intensities).length;
  const canSave = selectedCount > 0 || memo.trim().length > 0;

  const toggleCondition = (id: number) => {
    setIntensities((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = 3;
      return next;
    });
  };

  const setIntensity = (id: number, value: number) => {
    setIntensities((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await upsertDiary({
        entryDate: date,
        memo: memo.trim() || undefined,
        symptoms: Object.entries(intensities).map(([conditionId, intensity]) => ({
          conditionId: Number(conditionId),
          intensity,
        })),
      });
      toast.success("증상 일기를 저장했어요.");
      router.push("/diary");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDiary(date);
      toast.success("증상 일기를 삭제했어요.");
      router.push("/diary");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  // 선택된 위치(집/직장)의 날씨. 해당 위치가 없으면 있는 첫 번째로 폴백.
  const weather = useMemo(() => {
    if (weathers.length === 0) return null;
    return weathers.find((w) => w.locationType === weatherLocType) ?? weathers[0];
  }, [weathers, weatherLocType]);

  const hasHomeWeather = weathers.some((w) => w.locationType === "HOME");
  const hasWorkWeather = weathers.some((w) => w.locationType === "WORK");
  const hasBothWeathers = hasHomeWeather && hasWorkWeather;

  const weatherSummary = useMemo(() => {
    if (!weather) return null;
    const parts: string[] = [];
    if (weather.weatherCondition) parts.push(weather.weatherCondition);
    if (weather.temperature) parts.push(`${weather.temperature}°`);
    if (weather.humidity) parts.push(`습도 ${weather.humidity}%`);
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [weather]);

  return (
    <div className={`flex flex-col bg-[#f2f4f6] px-5 pt-2 ${editable ? "pb-28" : "pb-8"}`}>
      <div className="mb-3 flex items-center justify-between">
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
        {isExisting && editable && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full bg-[rgba(240,68,82,0.1)] px-3.5 py-1.5 text-[13px] font-semibold text-[#f04452] active:scale-95"
          >
            삭제
          </button>
        )}
      </div>

      <h1 className="px-1 text-[22px] font-bold tracking-[-0.02em] text-[#191f28]">
        {formatDateKo(date)}
      </h1>
      {weatherSummary && (
        <p className="mt-1 px-1 text-[13px] font-medium text-[#8b95a1]">
          {weather?.regionName ? `${weather.regionName} · ` : ""}
          {weatherSummary}
        </p>
      )}

      {weather && (
        <section className="mt-4 rounded-[16px] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[#191f28]">
              {isLiveWeather ? "지금 날씨" : "기록된 날씨"}
            </h2>
            {hasBothWeathers && (
              <div className="flex shrink-0 items-center gap-0.5 rounded-[10px] bg-[#f2f4f6] p-0.5">
                <button
                  type="button"
                  onClick={() => setWeatherLocType("HOME")}
                  className={`rounded-[8px] px-3 py-1 text-[12px] font-semibold transition-all ${
                    weatherLocType === "HOME"
                      ? "bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-[#8b95a1]"
                  }`}
                >
                  거주지역
                </button>
                <button
                  type="button"
                  onClick={() => setWeatherLocType("WORK")}
                  className={`rounded-[8px] px-3 py-1 text-[12px] font-semibold transition-all ${
                    weatherLocType === "WORK"
                      ? "bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-[#8b95a1]"
                  }`}
                >
                  직장/학교
                </button>
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[13px] font-medium text-[#8b95a1]">
            {weather.regionName ? `${weather.regionName} · ` : ""}
            {isLiveWeather
              ? "저장하면 지금 날씨가 함께 기록돼요."
              : "증상을 기록한 시점의 환경이에요."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <DiaryEnvCard
              title="미세먼지"
              sub="PM10"
              label={GRADE_LABEL[weather.pm10Grade ?? ""] ?? "-"}
              value={weather.pm10Value ? `${weather.pm10Value} ㎍/㎥` : "-"}
              tone={gradeTone(weather.pm10Grade)}
            />
            <DiaryEnvCard
              title="초미세먼지"
              sub="PM2.5"
              label={GRADE_LABEL[weather.pm25Grade ?? ""] ?? "-"}
              value={weather.pm25Value ? `${weather.pm25Value} ㎍/㎥` : "-"}
              tone={gradeTone(weather.pm25Grade)}
            />
            <DiaryEnvCard
              title="자외선"
              sub="UV"
              label={uvLabel(weather.uvRiskLevel)}
              value={weather.uvRiskLevel ? `지수 ${weather.uvRiskLevel}` : "-"}
              tone={uvTone(weather.uvRiskLevel)}
            />
            <DiaryEnvCard
              title="꽃가루"
              sub="Pollen"
              label={POLLEN_LABEL[weather.pollenRiskLevel ?? ""] ?? "-"}
              value="위험도"
              tone={pollenTone(weather.pollenRiskLevel)}
            />
          </div>
        </section>
      )}

      {loading ? (
        <>
          <section className="mt-4 rounded-[16px] bg-white p-4">
            <div className="h-5 w-32 animate-pulse rounded bg-[#f2f4f6]" />
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-[14px] bg-[#f9fafb]" />
              ))}
            </div>
          </section>
          <section className="mt-4 rounded-[16px] bg-white p-4">
            <div className="h-5 w-24 animate-pulse rounded bg-[#f2f4f6]" />
            <div className="mt-4 flex flex-col gap-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 w-full animate-pulse rounded bg-[#f2f4f6]" />
              ))}
            </div>
          </section>
        </>
      ) : !editable ? (
        <>
          <section className="mt-4 rounded-[16px] bg-white p-4">
            <h2 className="text-[15px] font-bold text-[#191f28]">기록한 증상</h2>
            {symptoms.length > 0 ? (
              <div className="mt-3 flex flex-col">
                {symptoms.map((symptom) => (
                  <div
                    key={symptom.conditionId}
                    className="flex items-center justify-between gap-3 border-t border-[#f2f4f6] py-3 first:border-t-0"
                  >
                    <span className="text-[15px] font-semibold text-[#191f28]">
                      {symptom.conditionName}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <span
                            key={value}
                            className={`h-2 w-2 rounded-full ${
                              value <= symptom.intensity ? "bg-[#3182f6]" : "bg-[#e5e8eb]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="w-14 text-right text-[12px] font-semibold text-[#4e5968]">
                        {INTENSITY_LABELS[symptom.intensity - 1]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[14px] font-medium text-[#8b95a1]">
                기록된 증상이 없어요.
              </p>
            )}
          </section>

          {memo.trim().length > 0 && (
            <section className="mt-4 rounded-[16px] bg-white p-4">
              <h2 className="text-[15px] font-bold text-[#191f28]">메모</h2>
              <p className="mt-2 whitespace-pre-wrap break-keep text-[15px] leading-[1.5] text-[#333d4b]">
                {memo}
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="mt-4 rounded-[16px] bg-white p-4">
            <h2 className="text-[15px] font-bold text-[#191f28]">증상 강도</h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#8b95a1]">
              해당하는 질환을 누르고 강도를 골라주세요.
            </p>
            <div className="mt-3 flex flex-col">
              {conditions.map((condition) => {
                const selected = condition.conditionId in intensities;
                return (
                  <div key={condition.conditionId} className="border-t border-[#f2f4f6] py-3 first:border-t-0">
                    <button
                      type="button"
                      onClick={() => toggleCondition(condition.conditionId)}
                      className="flex w-full items-center justify-between"
                    >
                      <span className={`text-[15px] font-semibold ${selected ? "text-[#191f28]" : "text-[#4e5968]"}`}>
                        {condition.conditionName}
                      </span>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${
                          selected ? "bg-[#3182f6] text-white" : "bg-[#f2f4f6] text-[#b0b8c1]"
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          {selected ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}
                        </svg>
                      </span>
                    </button>
                    {selected && (
                      <div className="mt-3">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((value) => {
                            const on = intensities[condition.conditionId] === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setIntensity(condition.conditionId, value)}
                                className={`h-9 flex-1 rounded-[10px] text-[14px] font-bold transition-colors ${
                                  on ? "bg-[#3182f6] text-white" : "bg-[#f2f4f6] text-[#8b95a1]"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-1.5 text-[12px] font-medium text-[#8b95a1]">
                          {INTENSITY_LABELS[intensities[condition.conditionId] - 1]}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-4 rounded-[16px] bg-white p-4">
            <h2 className="text-[15px] font-bold text-[#191f28]">메모</h2>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="오늘 컨디션이나 특이사항을 자유롭게 남겨보세요."
              className="mt-2 w-full resize-none rounded-[14px] bg-[#f2f4f6] px-4 py-3 text-[15px] leading-[1.5] text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none"
            />
          </section>
        </>
      )}

      {editable && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md bg-gradient-to-t from-[#f2f4f6] via-[#f2f4f6] to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="h-14 w-full rounded-[16px] bg-[#3182f6] text-[17px] font-semibold text-white transition-transform active:enabled:scale-[0.99] active:enabled:bg-[#2272eb] disabled:opacity-40"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      )}
    </div>
  );
}

function DiaryEnvCard({
  title,
  sub,
  label,
  value,
  tone,
}: {
  title: string;
  sub: string;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex flex-col rounded-[14px] bg-[#f9fafb] p-3.5">
      <p className="text-[13px] font-semibold leading-tight text-[#4e5968]">
        {title}
        <span className="ml-0.5 text-[10px] font-medium text-[#b0b8c1]">{sub}</span>
      </p>
      <p className={`mt-2 text-[22px] font-bold leading-none tracking-[-0.02em] ${tone}`}>
        {label}
      </p>
      <span className="mt-2 text-[12px] font-medium leading-tight text-[#8b95a1]">
        {value}
      </span>
    </div>
  );
}
