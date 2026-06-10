import { Weather } from "#/service/types";
import { WeatherIcon, ConditionIcon } from "@/components"

const weatherIconIndex: Record<string, [number, number]> = {
  "맑음":     [0,  1],
  "구름많음": [4,  5],
  "흐림":     [6,  6],
  "비":       [8,  8],
  "비/눈":    [13, 13],
  "눈":       [11, 11],
};

function getWeatherIconIndex(condition: string): number {
  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const pair = weatherIconIndex[condition] ?? [0, 0];
  return isDay ? pair[0] : pair[1];
}

const gradeLabel: Record<string, string> = { "1": "좋음", "2": "보통", "3": "나쁨", "4": "매우나쁨" };
const gradeDot: Record<string, string> = {
  "1": "bg-blue-400",
  "2": "bg-green-500",
  "3": "bg-orange-400",
  "4": "bg-[#f04452]",
};
const gradeText: Record<string, string> = {
  "1": "text-blue-400",
  "2": "text-green-500",
  "3": "text-orange-400",
  "4": "text-[#f04452]",
};

const pollenLabel: Record<string, string> = { "0": "낮음", "1": "낮음", "2": "보통", "3": "높음", "4": "매우높음" };
const pollenDot: Record<string, string> = {
  "0": "bg-blue-400", "1": "bg-blue-400", "2": "bg-green-500", "3": "bg-orange-400", "4": "bg-[#f04452]",
};
const pollenText: Record<string, string> = {
  "0": "text-blue-400", "1": "text-blue-400", "2": "text-green-500", "3": "text-orange-400", "4": "text-[#f04452]",
};

function uvLabel(level: string): string {
  const n = Number(level);
  if (isNaN(n)) return "-";
  if (n <= 2) return "낮음";
  if (n <= 5) return "보통";
  if (n <= 7) return "높음";
  if (n <= 10) return "매우높음";
  return "위험";
}

function uvDot(level: string): string {
  const n = Number(level);
  if (isNaN(n)) return "bg-gray-300";
  if (n <= 2) return "bg-blue-400";
  if (n <= 5) return "bg-green-500";
  if (n <= 7) return "bg-orange-400";
  if (n <= 10) return "bg-[#f04452]";
  return "bg-red-700";
}

function uvText(level: string): string {
  const n = Number(level);
  if (isNaN(n)) return "text-gray-400";
  if (n <= 2) return "text-blue-400";
  if (n <= 5) return "text-green-500";
  if (n <= 7) return "text-orange-400";
  if (n <= 10) return "text-[#f04452]";
  return "text-red-700";
}

function gradeIcon(grade: string): number {
  return grade === "3" || grade === "4" ? 1 : 0;
}
function uvIcon(level: string): number {
  return Number(level) >= 6 ? 1 : 0;
}
function pollenIcon(level: string): number {
  return level === "3" || level === "4" ? 1 : 0;
}

type Props = {
  weather?: Weather;
  loading?: boolean;
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-[#e8e8ea] rounded-xl animate-pulse ${className}`} />
);

type AirCardProps = {
  title: string;
  sub?: string;
  label: string;
  value: string;
  dotColor: string;
  textColor: string;
  iconIndex: number;
};

function AirCard({ title, sub, label, value, dotColor, textColor, iconIndex }: AirCardProps) {
  return (
    <div className="flex flex-col justify-between bg-[#f2f4f6] rounded-2xl p-3 gap-3 flex-1">
      <div>
        <p className="text-[11px] font-semibold text-[#191f28] leading-tight">{title}</p>
        {sub && <p className="text-[10px] text-[#8b95a1]">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className={`text-[13px] font-semibold ${textColor}`}>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8b95a1]">{value}</span>
        <ConditionIcon index={iconIndex} scale={0.1875} />
      </div>
    </div>
  );
}

export default function WeatherSection({ weather, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="bg-[#f2f4f6] rounded-3xl p-6 flex items-center gap-6">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-28 h-12" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-[#f2f4f6] rounded-2xl p-3 flex flex-col gap-3">
              <Skeleton className="w-full h-3" />
              <Skeleton className="w-12 h-4" />
              <Skeleton className="w-full h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const humidity = weather?.humidity ?? "";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 메인 날씨 카드 */}
      <div className="bg-[#f2f4f6] rounded-3xl p-6 flex items-center gap-6">
        <div className="shrink-0">
          <WeatherIcon index={getWeatherIconIndex(weather?.weatherCondition ?? "")} isOnlyIcon={true} />
        </div>
        <div className="flex flex-col">
          <p className="text-[13px] text-[#8b95a1] tracking-[-0.01em]">
            {weather?.weatherCondition ?? "날씨 정보 없음"}
          </p>
          <h2 className="text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#191f28] -mt-1">
            {weather?.temperature ?? "--"}°
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[13px] text-[#8b95a1]">습도 {humidity || "--"}%</span>
          </div>
        </div>
      </div>

      {/* 대기 정보 카드 4종 */}
      <div className="flex gap-2">
        <AirCard
          title="미세먼지"
          sub="PM10"
          label={gradeLabel[weather?.pm10Grade ?? ""] ?? "-"}
          value={weather?.pm10Value ? `${weather.pm10Value}㎍/㎥` : "-"}
          dotColor={gradeDot[weather?.pm10Grade ?? ""] ?? "bg-gray-300"}
          textColor={gradeText[weather?.pm10Grade ?? ""] ?? "text-gray-400"}
          iconIndex={gradeIcon(weather?.pm10Grade ?? "")}
        />
        <AirCard
          title="초미세먼지"
          sub="PM2.5"
          label={gradeLabel[weather?.pm25Grade ?? ""] ?? "-"}
          value={weather?.pm25Value ? `${weather.pm25Value}㎍/㎥` : "-"}
          dotColor={gradeDot[weather?.pm25Grade ?? ""] ?? "bg-gray-300"}
          textColor={gradeText[weather?.pm25Grade ?? ""] ?? "text-gray-400"}
          iconIndex={gradeIcon(weather?.pm25Grade ?? "")}
        />
        <AirCard
          title="자외선"
          sub="UV"
          label={weather?.uvRiskLevel ? uvLabel(weather.uvRiskLevel) : "-"}
          value={weather?.uvRiskLevel ?? "-"}
          dotColor={uvDot(weather?.uvRiskLevel ?? "")}
          textColor={uvText(weather?.uvRiskLevel ?? "")}
          iconIndex={uvIcon(weather?.uvRiskLevel ?? "")}
        />
        <AirCard
          title="꽃가루"
          label={pollenLabel[weather?.pollenRiskLevel ?? ""] ?? "-"}
          value="위험도"
          dotColor={pollenDot[weather?.pollenRiskLevel ?? ""] ?? "bg-gray-300"}
          textColor={pollenText[weather?.pollenRiskLevel ?? ""] ?? "text-gray-400"}
          iconIndex={pollenIcon(weather?.pollenRiskLevel ?? "")}
        />
      </div>
    </div>
  );
}
 
