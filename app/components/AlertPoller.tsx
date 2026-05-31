'use client'

import { useEffect } from "react";
import toast from "react-hot-toast";
import { getAlerts, getAlertHistory } from "#/service/alert";
import { getFamilies } from "#/service/family";
import { type Alert, type FamilySummary, type NotificationHistory } from "#/service/types";

export const ALERT_TIMES_STORAGE_KEY = "alertTimes";
export const ALERT_HISTORY_IDS_STORAGE_KEY = "alertHistoryIds";
export const ALERT_TIMES_CHANGED_EVENT = "alertTimesChanged";
export const ALERT_HISTORY_UPDATED_EVENT = "alertHistoryUpdated";

const DAY_MS = 24 * 60 * 60 * 1000;

export const saveAlertTimes = (alerts: Alert[]) => {
  const times = alerts
    .filter((alert) => alert.isEnable)
    .map((alert) => alert.alertTime)
    .sort();

  localStorage.setItem(ALERT_TIMES_STORAGE_KEY, JSON.stringify(times));
  window.dispatchEvent(new Event(ALERT_TIMES_CHANGED_EVENT));
};

const saveAllAlertTimes = (alerts: Alert[], families: FamilySummary[]) => {
  const personalTimes = alerts
    .filter((alert) => alert.isEnable)
    .map((alert) => alert.alertTime);
  const familyTimes = families.flatMap((family) => family.alertTimes);
  const times = [...personalTimes, ...familyTimes]
    .sort();

  localStorage.setItem(ALERT_TIMES_STORAGE_KEY, JSON.stringify(times));
};

const publishAlertHistory = (history: NotificationHistory[]) => {
  window.dispatchEvent(
    new CustomEvent(ALERT_HISTORY_UPDATED_EVENT, {
      detail: { history },
    })
  );
};

const getStoredHistoryIds = () => {
  try {
    const stored = localStorage.getItem(ALERT_HISTORY_IDS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as number[]) : null;
  } catch {
    return null;
  }
};

const saveHistoryIds = (history: NotificationHistory[]) => {
  localStorage.setItem(
    ALERT_HISTORY_IDS_STORAGE_KEY,
    JSON.stringify(history.map((item) => item.historyId))
  );
};

const notifyNewHistory = (history: NotificationHistory[]) => {
  const storedIds = getStoredHistoryIds();
  saveHistoryIds(history);

  if (!storedIds) return;

  const knownIds = new Set(storedIds);
  const newItems = history.filter((item) => !knownIds.has(item.historyId));
  if (newItems.length === 0) return;

  toast.success(
    newItems.length === 1
      ? "새 알림이 도착했습니다."
      : `새 알림 ${newItems.length}개가 도착했습니다.`
  );
};

const getStoredAlertTimes = () => {
  try {
    const stored = localStorage.getItem(ALERT_TIMES_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

const getNextAlertDelay = (times: string[]) => {
  const now = new Date();
  const candidates = times
    .map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const date = new Date(now);
      date.setHours(hour, minute, 0, 0);
      if (date.getTime() <= now.getTime()) {
        date.setTime(date.getTime() + DAY_MS);
      }
      return date.getTime() - now.getTime();
    })
    .filter((delay) => delay > 0);

  return candidates.length > 0 ? Math.min(...candidates) : null;
};

export default function AlertPoller() {
  useEffect(() => {
    let timeoutId: number | null = null;
    let cancelled = false;
    let isSyncingHistory = false;

    const clearTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const syncHistory = async () => {
      if (
        cancelled ||
        isSyncingHistory ||
        document.visibilityState !== "visible" ||
        !localStorage.getItem("accessToken")
      ) {
        return;
      }

      isSyncingHistory = true;
      try {
        const history = await getAlertHistory();
        if (cancelled) return;
        publishAlertHistory(history);
        notifyNewHistory(history);
      } catch {
      } finally {
        isSyncingHistory = false;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      const delay = getNextAlertDelay(getStoredAlertTimes());
      if (delay === null) return;

      timeoutId = window.setTimeout(async () => {
        await syncHistory();
        if (!cancelled) scheduleNext();
      }, delay);
    };

    const syncAlertTimes = async () => {
      if (!localStorage.getItem("accessToken")) {
        localStorage.removeItem(ALERT_TIMES_STORAGE_KEY);
        localStorage.removeItem(ALERT_HISTORY_IDS_STORAGE_KEY);
        clearTimer();
        return;
      }

      try {
        const [alerts, familySummaries] = await Promise.all([
          getAlerts(),
          getFamilies().catch(() => []),
        ]);
        if (cancelled) return;
        saveAllAlertTimes(alerts, familySummaries);
        scheduleNext();
      } catch {
        scheduleNext();
      }
    };

    // getAlerts: 최초 로드 + 알림설정 변경 시에만
    window.addEventListener(ALERT_TIMES_CHANGED_EVENT, syncAlertTimes);
    syncAlertTimes();
    // getAlertHistory: 최초 로드 1회로 baseline 세팅, 이후 알림시간(scheduleNext)에만
    syncHistory();

    return () => {
      cancelled = true;
      clearTimer();
      window.removeEventListener(ALERT_TIMES_CHANGED_EVENT, syncAlertTimes);
    };
  }, []);

  return null;
}
