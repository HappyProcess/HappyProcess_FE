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
    <div className="flex min-h-full flex-col bg-[#f2f4f6] px-5 pb-24 pt-2">
      {/* 알림 설정 */}
      <section className="flex flex-col">
        <div className="mb-3 flex items-center justify-between px-1">
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#191f28]">
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
            className={`grid h-10 w-10 place-items-center rounded-full bg-[#3182f6] text-[24px] font-light leading-none text-white transition-all active:scale-[0.92] active:bg-[#2272eb] ${
              isAdding ? "rotate-45" : ""
            }`}
          >
            +
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-[14px] bg-[#fdecee] px-4 py-3 text-[14px] font-medium text-[#f04452]">
            {error}
          </div>
        )}

        {isAdding && (
          <div className="mb-3 flex flex-col gap-4 rounded-[16px] border border-[#e5e8eb] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <input
                type="time"
                value={newTime}
                onChange={(event) => setNewTime(event.target.value)}
                className="min-w-0 bg-transparent text-[30px] font-bold leading-none tracking-[-0.02em] text-[#191f28] outline-none"
              />
              <LocationToggle value={locationType} onChange={setLocationType} />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 rounded-[14px] bg-[#f2f4f6] py-3 text-[15px] font-semibold text-[#4e5968] transition-transform active:scale-[0.98]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 rounded-[14px] bg-[#3182f6] py-3 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] active:bg-[#2272eb] disabled:opacity-40"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-[16px] border border-[#e5e8eb] bg-white px-5 py-7 text-center text-[15px] font-medium text-[#8b95a1]">
            불러오는 중...
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-[16px] border border-[#e5e8eb] bg-white px-5 py-9 text-center text-[15px] font-medium text-[#8b95a1]">
            설정한 알림이 없어요.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[16px] border border-[#e5e8eb] bg-white">
            {alerts.map((alert, index) => (
              <li
                key={alert.alertId}
                className={index > 0 ? "border-t border-[#f2f4f6]" : ""}
              >
                {editingId === alert.alertId ? (
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="time"
                        value={editTime}
                        onChange={(event) => setEditTime(event.target.value)}
                        className="min-w-0 bg-transparent text-[30px] font-bold leading-none tracking-[-0.02em] text-[#191f28] outline-none"
                      />
                      <LocationToggle value={locationType} onChange={setLocationType} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.alertId)}
                        className="rounded-[14px] bg-[#fdecee] px-4 py-3 text-[15px] font-semibold text-[#f04452] transition-transform active:scale-[0.98]"
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 rounded-[14px] bg-[#f2f4f6] py-3 text-[15px] font-semibold text-[#4e5968] transition-transform active:scale-[0.98]"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(alert.alertId)}
                        className="flex-1 rounded-[14px] bg-[#3182f6] py-3 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] active:bg-[#2272eb]"
                      >
                        완료
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span
                        className={`text-[36px] font-bold leading-none tracking-[-0.02em] max-[360px]:text-[30px] ${
                          alert.isEnable ? "text-[#191f28]" : "text-[#c4cad2]"
                        }`}
                      >
                        {alert.alertTime}
                      </span>
                      <div className="flex items-center gap-2">
                        <LocationBadge locationType={alert.locationType} />
                        <button
                          type="button"
                          onClick={() => startEdit(alert)}
                          className="text-[13px] font-semibold tracking-[-0.01em] text-[#8b95a1] transition-transform active:scale-[0.95]"
                        >
                          편집
                        </button>
                      </div>
                    </div>
                    <Switch checked={alert.isEnable} onClick={() => handleToggle(alert)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 알림 센터 */}
      <section className="mt-8 flex flex-col">
        <div className="mb-3 flex items-center gap-2 px-1">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#191f28]">
            알림 센터
          </h2>
          {unreadCount > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-[#3182f6] px-1.5 py-0.5 text-[12px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-[16px] border border-[#e5e8eb] bg-white px-5 py-7 text-center text-[15px] font-medium text-[#8b95a1]">
            불러오는 중...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-[16px] border border-[#e5e8eb] bg-white px-5 py-9 text-center text-[15px] font-medium text-[#8b95a1]">
            받은 알림이 없어요.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((item) => (
              <li
                key={item.historyId}
                className={`overflow-hidden rounded-[16px] ${
                  item.isRead ? "bg-white" : "bg-[#f4f9ff]"
                }`}
              >
                {/* 헤더 띠 */}
                <div className="flex items-center gap-2.5 px-4 pt-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#fff0f1]">
                    <IllnessIcon index={getConditionIconIndex(getPrimaryHistoryDiseaseName(item))} scale={0.1} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[16px] font-bold tracking-[-0.01em] text-[#191f28]">
                        외출 주의 필요
                      </p>
                      {!item.isRead && <span className="h-1.5 w-1.5 rounded-full bg-[#3182f6]" />}
                    </div>
                    <p className="mt-0.5 text-[12px] font-medium text-[#8b95a1]">{item.createdAt}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <HistoryLocationBadge locationType={item.locationType} />
                    {getHistoryRelativeLabel(item) && (
                      <span className="rounded-full bg-[#f2f4f6] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#4e5968]">
                        {getHistoryRelativeLabel(item)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 내용 */}
                <div className="mt-3.5 flex flex-col gap-2.5 px-4">
                  <ChipGroup label="주의 질환" items={getHistoryDiseaseNames(item)} tone="danger" />
                  {getHistoryFactorNames(item).length > 0 && (
                    <ChipGroup label="요인" items={getHistoryFactorNames(item)} tone="neutral" />
                  )}
                </div>

                {/* 액션 */}
                <div className="mt-4 flex items-center gap-2 border-t border-[#f2f4f6] px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteHistory(item.historyId)}
                    className="flex-1 rounded-[12px] py-2.5 text-[14px] font-semibold text-[#8b95a1] transition-colors active:bg-[#f2f4f6]"
                  >
                    삭제
                  </button>
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleReadHistory(item)}
                      className="flex-1 rounded-[12px] bg-[#3182f6] py-2.5 text-[14px] font-semibold text-white transition-transform active:scale-[0.98] active:bg-[#2272eb]"
                    >
                      확인했어요
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
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
      className={`relative h-8 w-13 shrink-0 rounded-full transition-colors active:scale-[0.96] ${
        checked ? "bg-[#3182f6]" : "bg-[#e5e8eb]"
      }`}
    >
      <span
        className={`absolute top-1/2 h-6.5 w-6.5 -translate-y-1/2 rounded-full bg-white transition-all ${
          checked ? "right-0.75" : "left-0.75"
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
    <div className="flex shrink-0 items-center rounded-full bg-[#f2f4f6] p-0.5">
      <button
        type="button"
        onClick={() => onChange("HOME")}
        className={`rounded-full px-3 py-1 text-[12px] font-semibold tracking-[-0.01em] transition-colors ${
          value === "HOME" ? "bg-white text-[#191f28]" : "text-[#8b95a1]"
        }`}
      >
        집
      </button>
      <button
        type="button"
        onClick={() => onChange("WORK")}
        className={`rounded-full px-3 py-1 text-[12px] font-semibold tracking-[-0.01em] transition-colors ${
          value === "WORK" ? "bg-white text-[#191f28]" : "text-[#8b95a1]"
        }`}
      >
        직장
      </button>
    </div>
  );
}

function LocationBadge({ locationType }: { locationType: Alert["locationType"] }) {
  return (
    <span className="rounded-full bg-[#f2f4f6] px-2 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em] text-[#191f28]">
      {getAlertLocationLabel(locationType)}
    </span>
  );
}

function HistoryLocationBadge({ locationType }: { locationType: Alert["locationType"] }) {
  return (
    <span className="rounded-full bg-[#eef1f4] px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em] text-[#4e5968]">
      {getAlertLocationLabel(locationType)}
    </span>
  );
}

function ChipGroup({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "danger" | "neutral";
}) {
  const chipClass =
    tone === "danger"
      ? "bg-[#fff0f1] text-[#e8404f]"
      : "bg-[#f2f4f6] text-[#4e5968]";
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 shrink-0 text-[12px] font-semibold text-[#8b95a1]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className={`rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${chipClass}`}
            >
              {name}
            </span>
          ))
        ) : (
          <span className="py-1 text-[13px] font-medium text-[#8b95a1]">-</span>
        )}
      </div>
    </div>
  );
}
