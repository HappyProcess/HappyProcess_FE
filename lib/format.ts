// LocalDateTime 문자열("2026-06-10T12:34:56") → "2026.06.10 12:34"
export function formatDateTime(value: string): string {
  if (!value) return "";
  const [datePart, timePart = ""] = value.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return value;
  const hm = timePart.slice(0, 5);
  return hm ? `${y}.${m}.${d} ${hm}` : `${y}.${m}.${d}`;
}

// 작성자명 비교용 — 앞자리 숫자 제거(Navigation의 cleanName과 동일 규칙)
export function cleanName(name: string): string {
  return (name ?? "").replace(/^\d+/, "");
}

// 로컬 타임존 기준 "YYYY-MM-DD"
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

// "YYYY-MM-DD" → Date(로컬 정오 기준, DST 안전)
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

// "YYYY-MM-DD" → "6월 10일 (수)"
export function formatDateKo(value: string): string {
  const date = parseISODate(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_KO[date.getDay()]})`;
}

export function weekdayKo(value: string): string {
  return WEEKDAY_KO[parseISODate(value).getDay()];
}

// 해당 주의 월요일 "YYYY-MM-DD"
export function mondayOf(value: string): string {
  const date = parseISODate(value);
  const day = date.getDay(); // 0=일 ~ 6=토
  const diff = day === 0 ? -6 : 1 - day; // 월요일까지의 차이
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}
