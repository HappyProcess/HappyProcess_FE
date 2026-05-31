'use client'

import { useEffect, useState } from "react";
import {
  ALERT_HISTORY_UPDATED_EVENT,
  saveAlertTimes,
} from "@/components/AlertPoller";
import IllnessIcon from "@/components/IconComponents/IllnessIcon";
import { getConditionIconIndex } from "@/constants/conditionIconMap";
import { type AlertLocationType, addAlert, updateAlert, getAlerts, toggleAlert, deleteAlert, getAlertHistory, readAlertHistory, deleteAlertHistory, ALERT_TIME_REGEX, isDuplicateAlertTime } from "#/service/alert";
import { type Alert, type NotificationHistory } from "#/service/types";

const getHistoryDiseaseNames = (item: NotificationHistory) =>
  item.diseaseNames
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

const getPrimaryHistoryDiseaseName = (item: NotificationHistory) =>
  getHistoryDiseaseNames(item)[0] ?? "건강";

const getHistoryFactorNames = (item: NotificationHistory) =>
  item.factorNames
    ?.split(",")
    .map((name) => name.trim())
    .filter(Boolean) ?? [];

const getHistoryRelativeLabel = (item: NotificationHistory) => {
  const relativeName = item.relativeName?.trim();
  return relativeName ? `가족 - ${relativeName}` : null;
};

const normalizeAlertLocationType = (
  locationType: Alert["locationType"]
): AlertLocationType => (locationType === "WORK" ? "WORK" : "HOME");

const getAlertLocationLabel = (locationType: Alert["locationType"]) =>
  normalizeAlertLocationType(locationType) === "HOME" ? "집" : "직장/학교";

const publishAlertHistory = (history: NotificationHistory[]) => {
  window.dispatchEvent(
    new CustomEvent(ALERT_HISTORY_UPDATED_EVENT, {
      detail: { history },
    })
  );
};

export default function AlarmPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState("08:00");
  const [isAdding, setIsAdding] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState("");
  const [locationType, setLocationType] = useState<AlertLocationType>("HOME");

  useEffect(() => {
    Promise.all([getAlerts(), getAlertHistory()])
      .then(([alertList, historyList]) => {
        setAlerts(alertList);
        saveAlertTimes(alertList);
        setHistory(historyList);
      })
      .catch(() => setError("알림 정보를 불러오지 못했어요."))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = history.reduce((n, item) => (item.isRead ? n : n + 1), 0);

  // saveAlertTimes는 ALERT_TIMES_CHANGED_EVENT를 dispatch → AlertPoller가 getAlerts로 재동기화한다.
  // 낙관적 setAlerts에 반응하는 effect로 호출하면 PATCH 완료 전에 refetch가 돌아 stale 데이터가 잡힌다.
  // 따라서 각 mutation을 await한 뒤에만 명시적으로 호출한다.

  useEffect(() => {
    const handleHistoryUpdated = (event: Event) => {
      const { history: nextHistory } = (event as CustomEvent<{
        history: NotificationHistory[];
      }>).detail;
      setHistory(nextHistory);
    };

    window.addEventListener(ALERT_HISTORY_UPDATED_EVENT, handleHistoryUpdated);
    return () => window.removeEventListener(ALERT_HISTORY_UPDATED_EVENT, handleHistoryUpdated);
  }, []);

  const handleAdd = async () => {
    setError(null);
    if (!ALERT_TIME_REGEX.test(newTime)) {
      setError("시간 형식이 올바르지 않아요.");
      return;
    }

    setAdding(true);
    try {
      const created = await addAlert(newTime, locationType);
      const next = [...alerts, created].sort((a, b) =>
        a.alertTime.localeCompare(b.alertTime)
      );
      setAlerts(next);
      saveAlertTimes(next);
      setIsAdding(false);
    } catch (err) {
      setError(isDuplicateAlertTime(err) ? "이미 등록된 시간이에요." : "알림을 추가하지 못했어요.");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (alert: Alert) => {
    setError(null);
    setIsAdding(false);
    setEditingId(alert.alertId);
    setEditTime(alert.alertTime);
    setLocationType(normalizeAlertLocationType(alert.locationType));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTime("");
  };

  const handleSaveEdit = async (alertId: number) => {
    setError(null);
    if (!ALERT_TIME_REGEX.test(editTime)) {
      setError("시간 형식이 올바르지 않아요.");
      return;
    }

    try {
      const updated = await updateAlert(alertId, editTime, locationType);
      const next = alerts
        .map((alert) => (alert.alertId === alertId ? updated : alert))
        .sort((a, b) => a.alertTime.localeCompare(b.alertTime));
      setAlerts(next);
      saveAlertTimes(next);
      cancelEdit();
    } catch (err) {
      setError(isDuplicateAlertTime(err) ? "이미 등록된 시간이에요." : "시간을 수정하지 못했어요.");
    }
  };

  const handleToggle = async (alert: Alert) => {
    const next = !alert.isEnable;
    const optimistic = alerts.map((item) =>
      item.alertId === alert.alertId ? { ...item, isEnable: next } : item
    );
    setAlerts(optimistic);

    try {
      await toggleAlert(alert.alertId, next);
      // PATCH 완료 후에만 재동기화 트리거 (동시 호출 시 변경 전 데이터가 잡히는 문제 방지)
      saveAlertTimes(optimistic);
    } catch {
      setAlerts(alerts);
      setError("알림 설정을 변경하지 못했어요.");
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    const prev = alerts;
    const next = alerts.filter((alert) => alert.alertId !== alertId);
    setAlerts(next);

    try {
      await deleteAlert(alertId);
      saveAlertTimes(next);
      cancelEdit();
    } catch {
      setAlerts(prev);
      setError("알림을 삭제하지 못했어요.");
    }
  };

  const handleReadHistory = async (item: NotificationHistory) => {
    if (item.isRead) return;

    const prev = history;
    const next = history.map((historyItem) =>
      historyItem.historyId === item.historyId ? { ...historyItem, isRead: true } : historyItem
    );
    setHistory(next);
    publishAlertHistory(next);

    try {
      await readAlertHistory(item.historyId);
    } catch {
      setHistory(prev);
      publishAlertHistory(prev);
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    const prev = history;
    const next = history.filter((item) => item.historyId !== historyId);
    setHistory(next);
    publishAlertHistory(next);

    try {
      await deleteAlertHistory(historyId);
    } catch {
      setHistory(prev);
      publishAlertHistory(prev);
      setError("알림 기록을 삭제하지 못했어요.");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-white px-5 pb-24 pt-7">
      <section className="flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.374px] text-[#1d1d1f]">
            알림
          </h1>
          <button
            type="button"
            aria-label="알림 추가"
            onClick={() => {
              setError(null);
              cancelEdit();
              setIsAdding((value) => !value);
            }}
            className="grid h-11 w-11 place-items-center rounded-full text-[34px] font-light leading-none text-[#0066cc] transition-transform active:scale-95"
          >
            +
          </button>
        </div>

        <div className="mt-6 h-px w-full bg-[#e0e0e0]" />

        {error && (
          <p className="border-b border-[#e0e0e0] py-3 text-[14px] font-normal tracking-[-0.224px] text-red-500">
            {error}
          </p>
        )}

        {isAdding && (
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[#e0e0e0] py-5">
            <input
              type="time"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
              className="min-w-0 bg-transparent text-[30px] font-semibold leading-none tracking-[-0.28px] text-[#1d1d1f] outline-none"
            />
            <LocationToggle value={locationType} onChange={setLocationType} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className="rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-normal tracking-[-0.224px] text-white transition-transform active:scale-95 disabled:opacity-40"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[14px] font-normal tracking-[-0.224px] text-[#7a7a7a] transition-transform active:scale-95"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="border-b border-[#e0e0e0] py-7 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
            불러오는 중...
          </p>
        ) : alerts.length === 0 ? (
          <p className="border-b border-[#e0e0e0] py-7 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
            설정한 알림이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col">
            {alerts.map((alert) => (
              <li key={alert.alertId} className="border-b border-[#e0e0e0] py-5">
                {editingId === alert.alertId ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={editTime}
                        onChange={(event) => setEditTime(event.target.value)}
                        className="min-w-0 bg-transparent text-[30px] font-semibold leading-none tracking-[-0.28px] text-[#1d1d1f] outline-none"
                      />
                      <LocationToggle value={locationType} onChange={setLocationType} />
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.alertId)}
                        className="text-[14px] font-normal tracking-[-0.224px] text-[#7a7a7a] transition-transform active:scale-95"
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-[14px] font-normal tracking-[-0.224px] text-[#7a7a7a] transition-transform active:scale-95"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(alert.alertId)}
                        className="rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-normal tracking-[-0.224px] text-white transition-transform active:scale-95"
                      >
                        완료
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 max-[360px]:gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`text-[34px] font-semibold leading-none tracking-[-0.28px] max-[360px]:text-[30px] ${
                          alert.isEnable ? "text-[#1d1d1f]" : "text-[#cccccc]"
                        }`}
                      >
                        {alert.alertTime}
                      </span>
                      <LocationBadge locationType={alert.locationType} />
                    </div>
                    <Switch checked={alert.isEnable} onClick={() => handleToggle(alert)} />
                    <button
                      type="button"
                      onClick={() => startEdit(alert)}
                      className="text-[17px] font-normal tracking-[-0.374px] text-[#0066cc] transition-transform active:scale-95 max-[360px]:text-[15px]"
                    >
                      편집
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.374px] text-[#1d1d1f]">
            알림 센터
          </h2>
          {unreadCount > 0 && (
            <span className="min-w-7 rounded-full bg-[#0066cc] px-2 py-1 text-center text-[12px] font-semibold leading-none tracking-[-0.12px] text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col">
          {loading ? (
            <p className="border-t border-[#e0e0e0] py-5 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
              불러오는 중...
            </p>
          ) : history.length === 0 ? (
            <p className="border-t border-[#e0e0e0] py-5 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
              받은 알림이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {history.map((item) => (
                <li
                  key={item.historyId}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center justify-end gap-3">
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#0066cc]" />
                    )}
                    <span className="text-right text-[17px] font-semibold leading-none tracking-[-0.374px] text-[#1d1d1f]">
                      {item.createdAt}
                    </span>
                  </div>

                  <div className="rounded-[18px] border border-[#ff8a8a] bg-[#fff1f1] p-4">
                    <div className="grid grid-cols-[112px_1fr_54px] items-center gap-4 max-[360px]:grid-cols-[82px_1fr_40px] max-[360px]:gap-3">
                      <div className="grid h-[104px] w-[104px] place-items-center bg-white max-[360px]:h-[82px] max-[360px]:w-[82px]">
                        <IllnessIcon index={getConditionIconIndex(getPrimaryHistoryDiseaseName(item))} scale={0.25} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <HistoryLocationBadge locationType={item.locationType} />
                          {getHistoryRelativeLabel(item) && (
                            <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold leading-none tracking-[-0.12px] text-red-500">
                              {getHistoryRelativeLabel(item)}
                            </span>
                          )}
                          <p className="text-[18px] font-semibold leading-[1.25] tracking-[-0.374px] text-[#1d1d1f] max-[360px]:text-[15px]">
                            외출 주의 필요
                          </p>
                        </div>
                        <div className="mt-3 flex flex-col gap-1.5 max-[360px]:mt-2">
                          <HistoryInfoRow label="주의 질환" value={getHistoryDiseaseNames(item).join(", ")} />
                          {getHistoryFactorNames(item).length > 0 && (
                            <HistoryInfoRow label="요인" value={getHistoryFactorNames(item).join(", ")} />
                          )}
                        </div>
                      </div>

                      <div className="flex h-full shrink-0 flex-col items-end justify-between">
                        <div className="relative h-12 w-14 max-[360px]:h-9 max-[360px]:w-10">
                          <div className="absolute inset-x-0 top-0 mx-auto h-0 w-0 border-x-[28px] border-b-[48px] border-x-transparent border-b-red-400 max-[360px]:border-x-[20px] max-[360px]:border-b-[36px]" />
                          <span className="absolute left-1/2 top-[13px] -translate-x-1/2 text-[28px] font-semibold leading-none text-white max-[360px]:top-[9px] max-[360px]:text-[22px]">
                            !
                          </span>
                        </div>
                        <div className="flex w-[74px] flex-col items-stretch gap-1.5 max-[360px]:w-[62px]">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={() => handleReadHistory(item)}
                              className="min-h-8 rounded-full bg-[#0066cc] px-3 text-[12px] font-semibold leading-none tracking-[-0.12px] text-white transition-transform active:scale-95 max-[360px]:px-2 max-[360px]:text-[11px]"
                            >
                              확인
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(item.historyId)}
                            className="min-h-7 rounded-full px-3 text-[12px] font-semibold leading-none tracking-[-0.12px] text-[#7a7a7a] transition-colors active:scale-95 active:bg-white/70 max-[360px]:px-2 max-[360px]:text-[11px]"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Switch({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={`relative h-10 w-[74px] shrink-0 rounded-full border-2 transition-colors active:scale-95 ${
        checked ? "border-[#1d1d1f] bg-[#1d1d1f]" : "border-[#d2d2d7] bg-white"
      }`}
    >
      <span
        className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full transition-all ${
          checked ? "right-0.5 bg-white" : "left-0.5 bg-[#1d1d1f]"
        }`}
      />
    </button>
  );
}

function LocationToggle({
  value,
  onChange,
}: {
  value: AlertLocationType;
  onChange: (value: AlertLocationType) => void;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-full bg-[#f5f5f7] p-0.5">
      <button
        type="button"
        onClick={() => onChange("HOME")}
        className={`rounded-full px-3 py-1 text-[12px] font-semibold tracking-[-0.12px] transition-colors ${
          value === "HOME" ? "bg-white text-[#1d1d1f]" : "text-[#7a7a7a]"
        }`}
      >
        집
      </button>
      <button
        type="button"
        onClick={() => onChange("WORK")}
        className={`rounded-full px-3 py-1 text-[12px] font-semibold tracking-[-0.12px] transition-colors ${
          value === "WORK" ? "bg-white text-[#1d1d1f]" : "text-[#7a7a7a]"
        }`}
      >
        직장
      </button>
    </div>
  );
}

function LocationBadge({ locationType }: { locationType: Alert["locationType"] }) {
  return (
    <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[11px] font-semibold leading-none tracking-[-0.12px] text-[#1d1d1f]">
      {getAlertLocationLabel(locationType)}
    </span>
  );
}

function HistoryLocationBadge({ locationType }: { locationType: Alert["locationType"] }) {
  return (
    <span className="rounded-full bg-[#0066cc] px-3 py-1.5 text-[12px] font-semibold leading-none tracking-[-0.12px] text-white">
      {getAlertLocationLabel(locationType)}
    </span>
  );
}

function HistoryInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="whitespace-normal break-keep text-[15px] font-semibold leading-[1.35] tracking-[-0.224px] text-[#1d1d1f] max-[360px]:text-[13px]">
      <span className="mr-1.5 inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[-0.12px] text-red-500">
        {label}
      </span>
      {value || "-"}
    </p>
  );
}
