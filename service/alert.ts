import { isAxiosError } from "axios";
import { api } from "#/lib/api";
import { dedupe } from "#/lib/dedupe";
import { type Alert, type NotificationHistory } from "./types";

export type AlertLocationType = "HOME" | "WORK";

// HH:mm (00:00 ~ 23:59)
export const ALERT_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// 중복 시간 등록/수정 시 서버가 409(DUPLICATE_ALERT_TIME) 반환
export const isDuplicateAlertTime = (err: unknown): boolean =>
  isAxiosError(err) && err.response?.status === 409;

// ── 알림 설정 ──────────────────────────────────────────────

// 알림 시간 추가 → 새 알림 반환 (기본 isEnable=true)
export const addAlert = async (
  alertTime: string,
  locationType: AlertLocationType
): Promise<Alert> => {
  const res = await api.post("/alerts", { alertTime, locationType });
  return res.data;
};

// 알림 시간 수정 → 수정된 알림 반환
export const updateAlert = async (
  alertId: number,
  alertTime: string,
  locationType: AlertLocationType
): Promise<Alert> => {
  const res = await api.patch(`/alerts/${alertId}`, { alertTime, locationType });
  return res.data;
};

// 내 알림 설정 목록 (시간 오름차순)
export const getAlerts = (): Promise<Alert[]> =>
  dedupe("alerts", async () => {
    const res = await api.get("/alerts");
    return res.data;
  });

// 알림 켜기/끄기 토글
export const toggleAlert = async (alertId: number, isEnable: boolean) => {
  return api.patch(`/alerts/${alertId}/toggle`, null, { params: { isEnable } });
};

// 알림 설정 삭제
export const deleteAlert = async (alertId: number) => {
  return api.delete(`/alerts/${alertId}`);
};

// ── 알림 발송 기록 (알림함) ────────────────────────────────

// 내 알림 발송 기록 (최신순)
export const getAlertHistory = (): Promise<NotificationHistory[]> =>
  dedupe("alerts/history", async () => {
    const res = await api.get("/alerts/history");
    return res.data;
  });

// 알림 기록 읽음 처리
export const readAlertHistory = async (historyId: number) => {
  return api.patch(`/alerts/history/${historyId}/read`);
};

// 알림 기록 삭제
export const deleteAlertHistory = async (historyId: number) => {
  return api.delete(`/alerts/history/${historyId}`);
};

// 안 읽은 알림 개수 — 전용 API 없음, 클라에서 직접 카운트
export const countUnread = (history: NotificationHistory[]): number =>
  history.reduce((n, h) => (h.isRead ? n : n + 1), 0);
