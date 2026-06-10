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
