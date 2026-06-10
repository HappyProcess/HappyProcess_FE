'use client'

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import IllnessIcon from "@/components/IconComponents/IllnessIcon";
import RegionSelect from "@/components/RegionSelectBoxes";
import { getConditionIconIndex } from "@/constants/conditionIconMap";
import { healthOptions, NO_CONDITION_ID } from "@/register/Options";
import { ALERT_TIME_REGEX, type AlertLocationType } from "#/service/alert";
import {
  addFamily,
  addFamilyAlert,
  deleteFamilyAlert,
  getFamily,
  getFamilies,
  refreshFamilies,
  toggleFamilyAlert,
  updateFamilyAlert,
  updateFamilyConditions,
  updateFamilyLocation,
} from "#/service/family";
import { type Alert, type Family, type FamilySummary, type Location, type LocationType } from "#/service/types";
import { getCachedSido } from "#/lib/cache";
import { parseError } from "#/lib/parseError";
import { ALERT_TIMES_CHANGED_EVENT } from "@/components/AlertPoller";

const selectClass =
  "border border-[#e5e8eb] rounded-[14px] px-4 py-3.5 text-[17px] text-[#191f28] bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6] cursor-pointer";

const locationLabel: Record<LocationType, string> = {
  HOME: "집",
  WORK: "직장/학교",
};

const normalizeConditionName = (name: string) => name.replace(/\s*\(.+?\)\s*$/, "").trim();

const getConditionIds = (names: string[]) =>
  healthOptions
    .filter((option) => names.some((name) => normalizeConditionName(name) === option.label))
    .map((option) => option.value);

const formatLocation = (location?: Location) =>
  location ? `${location.sido} ${location.sigungu} ${location.dong}` : "미설정";

const publishAlertTimesChanged = () => {
  window.dispatchEvent(new Event(ALERT_TIMES_CHANGED_EVENT));
};

export default function FamilyPage() {
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, Family>>({});
  const [relativeLoginId, setRelativeLoginId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidoList, setSidoList] = useState<string[]>([]);

  const reloadFamilies = async () => {
    const data = await refreshFamilies();
    setFamilies(data);
  };

  useEffect(() => {
    Promise.all([getFamilies(), getCachedSido()])
      .then(([familyList, sido]) => {
        setFamilies(familyList);
        setSidoList(sido);
      })
      .catch((err) => toast.error(parseError(err)))
      .finally(() => setLoading(false));
  }, []);

  const openFamily = async (familyId: number) => {
    setSelectedFamilyId(familyId);
    const cached = detailCache[familyId];
    if (cached) {
      setSelectedFamily(cached);
      return;
    }
    setSelectedFamily(null);
    try {
      const detail = await getFamily(familyId);
      setDetailCache((prev) => ({ ...prev, [familyId]: detail }));
      setSelectedFamily(detail);
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const handleAddFamily = async () => {
    const loginId = relativeLoginId.trim();
    if (!loginId) {
      toast.error("가족 로그인 ID를 입력해주세요.");
      return;
    }

    try {
      await addFamily(loginId);
      setRelativeLoginId("");
      setIsAdding(false);
      await reloadFamilies();
      toast.success("가족이 추가되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const updateFamilyInState = (nextFamily: Family) => {
    setSelectedFamily(nextFamily);
    setDetailCache((prev) => ({ ...prev, [nextFamily.familyId]: nextFamily }));
  };

  if (selectedFamilyId !== null) {
    return (
      selectedFamily ? (
        <FamilyProfileView
          key={selectedFamily.familyId}
          family={selectedFamily}
          sidoList={sidoList}
          onBack={() => {
            setSelectedFamilyId(null);
            setSelectedFamily(null);
          }}
          onFamilyChange={updateFamilyInState}
          onReload={async () => {
            await reloadFamilies();
            const detail = await getFamily(selectedFamily.familyId);
            setDetailCache((prev) => ({ ...prev, [detail.familyId]: detail }));
            setSelectedFamily(detail);
          }}
        />
      ) : (
        <FamilyProfileSkeleton
          onBack={() => {
            setSelectedFamilyId(null);
            setSelectedFamily(null);
          }}
        />
      )
    );
  }

  return (
    <div className="flex w-full flex-col overflow-x-clip bg-[#f2f4f6] px-5 pb-8 pt-2">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em] text-[#191f28]">
            가족
          </h1>
          <p className="mt-1 text-[14px] font-medium leading-tight tracking-[-0.01em] text-[#8b95a1]">
            내 가족 그룹
          </p>
        </div>
        <button
          type="button"
          aria-label="가족 추가"
          onClick={() => setIsAdding((value) => !value)}
          className={`grid h-10 w-10 place-items-center rounded-full bg-[#3182f6] text-[24px] font-light leading-none text-white transition-all active:scale-[0.92] active:bg-[#2272eb] ${
            isAdding ? "rotate-45" : ""
          }`}
        >
          +
        </button>
      </section>

      {isAdding && (
        <section className="mt-4 rounded-[16px] bg-white p-4">
          <label className="text-[14px] font-semibold tracking-[-0.01em] text-[#191f28]">
            가족 로그인 ID
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={relativeLoginId}
              onChange={(event) => setRelativeLoginId(event.target.value)}
              placeholder="papa123"
              className="min-w-0 flex-1 rounded-[14px] border border-[#e5e8eb] bg-white px-4 py-3 text-[17px] leading-[1.47] tracking-[-0.01em] text-[#191f28] focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
            />
            <button
              type="button"
              onClick={handleAddFamily}
              className="shrink-0 rounded-[14px] bg-[#3182f6] px-5 text-[15px] font-semibold leading-none tracking-[-0.01em] text-white transition-transform active:scale-[0.98] active:bg-[#2272eb]"
            >
              추가
            </button>
          </div>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-3">
        {loading ? (
          <p className="rounded-[16px] bg-white px-5 py-9 text-center text-[15px] font-medium tracking-[-0.01em] text-[#8b95a1]">
            불러오는 중...
          </p>
        ) : families.length === 0 ? (
          <p className="rounded-[16px] bg-white px-5 py-9 text-center text-[15px] font-medium tracking-[-0.01em] text-[#8b95a1]">
            등록된 가족이 없어요.
          </p>
        ) : (
          families.map((family) => (
            <FamilyMemberCard
              key={family.familyId}
              family={family}
              onOpen={() => openFamily(family.familyId)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function FamilyMemberCard({
  family,
  onOpen,
}: {
  family: FamilySummary;
  onOpen: () => void;
}) {
  const primaryCondition = family.healthConditionNames?.[0] ?? "건강";

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer rounded-[16px] bg-white p-4 transition-transform active:scale-[0.99]"
    >
      <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3">
        <Avatar />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold leading-tight tracking-[-0.01em] text-[#191f28]">
            {family.name}님
          </p>
          <p className="mt-1 truncate text-[13px] font-medium leading-tight tracking-[-0.01em] text-[#8b95a1]">
            {normalizeConditionName(primaryCondition)}
          </p>
          {(family.alertTimes?.length ?? 0) > 0 && (
            <p className="mt-1 truncate text-[12px] font-semibold leading-tight tracking-[-0.01em] text-[#3182f6]">
              알림 {family.alertTimes.join(", ")}
            </p>
          )}
        </div>
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-[#f2f4f6] text-[#8b95a1]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </div>
    </article>
  );
}

function FamilyProfileSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex w-full flex-col overflow-x-clip bg-[#f2f4f6] px-5 pb-8 pt-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton onBack={onBack} />
      </div>
      <section className="rounded-[16px] bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-[#f2f4f6]" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-32 animate-pulse rounded bg-[#f2f4f6]" />
            <div className="h-5 w-20 animate-pulse rounded bg-[#f2f4f6]" />
          </div>
        </div>
      </section>
      <div className="mt-5 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-xl bg-[#f2f4f6]" />
        ))}
      </div>
    </div>
  );
}

function FamilyProfileView({
  family,
  sidoList,
  onBack,
  onFamilyChange,
  onReload,
}: {
  family: Family;
  sidoList: string[];
  onBack: () => void;
  onFamilyChange: (family: Family) => void;
  onReload: () => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState(() => getConditionIds(family.healthConditionNames ?? []));
  const [editingLocType, setEditingLocType] = useState<LocationType | null>(null);
  const [editingAreaNo, setEditingAreaNo] = useState("");
  const [newAlertTime, setNewAlertTime] = useState("08:00");
  const [newAlertLocationType, setNewAlertLocationType] = useState<AlertLocationType>("HOME");
  const [editingAlertId, setEditingAlertId] = useState<number | null>(null);
  const [editingAlertTime, setEditingAlertTime] = useState("");
  const [editingAlertLocationType, setEditingAlertLocationType] = useState<AlertLocationType>("HOME");
  const [familyAlertEnabled, setFamilyAlertEnabled] = useState(family.alertEnabled);
  const [isAddingAlert, setIsAddingAlert] = useState(false);

  const savedConditionIds = getConditionIds(family.healthConditionNames ?? []);
  const conditionsDirty =
    selectedIds.length !== savedConditionIds.length ||
    selectedIds.some((id) => !savedConditionIds.includes(id));

  const familyLocations = family.locations ?? [];
  const familyAlerts = family.alerts ?? [];

  const home = familyLocations.find((location) => location.locationType === "HOME");
  const work = familyLocations.find((location) => location.locationType === "WORK");

  const toggleCondition = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id);
      if (id === NO_CONDITION_ID) return [NO_CONDITION_ID];
      return [...prev.filter((value) => value !== NO_CONDITION_ID), id];
    });
  };

  const saveConditions = async () => {
    try {
      await updateFamilyConditions(family.familyId, selectedIds);
      await onReload();
      toast.success("가족 건강 상태가 수정되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const saveLocation = async (locationType: LocationType) => {
    if (!editingAreaNo) {
      toast.error("지역을 선택해주세요.");
      return;
    }

    try {
      const location = await updateFamilyLocation(family.familyId, {
        locationType,
        areaNo: editingAreaNo,
      });
      onFamilyChange({
        ...family,
        locations: [
          ...familyLocations.filter((item) => item.locationType !== location.locationType),
          location,
        ],
      });
      setEditingLocType(null);
      setEditingAreaNo("");
      toast.success("가족 지역이 수정되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const addAlert = async () => {
    if (!ALERT_TIME_REGEX.test(newAlertTime)) {
      toast.error("시간 형식이 올바르지 않아요.");
      return;
    }

    try {
      const alert = await addFamilyAlert(family.familyId, newAlertTime, newAlertLocationType);
      onFamilyChange({ ...family, alerts: [...familyAlerts, alert] });
      setIsAddingAlert(false);
      await onReload();
      publishAlertTimesChanged();
      toast.success("가족 알림 시간이 추가되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const startEditAlert = (alert: Alert) => {
    setEditingAlertId(alert.alertId);
    setEditingAlertTime(alert.alertTime);
    setEditingAlertLocationType(alert.locationType === "WORK" ? "WORK" : "HOME");
  };

  const saveAlert = async (alertId: number) => {
    if (!ALERT_TIME_REGEX.test(editingAlertTime)) {
      toast.error("시간 형식이 올바르지 않아요.");
      return;
    }

    try {
      const alert = await updateFamilyAlert(
        family.familyId,
        alertId,
        editingAlertTime,
        editingAlertLocationType
      );
      onFamilyChange({
        ...family,
        alerts: familyAlerts.map((item) => (item.alertId === alertId ? alert : item)),
      });
      setEditingAlertId(null);
      await onReload();
      publishAlertTimesChanged();
      toast.success("가족 알림 시간이 수정되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const removeAlert = async (alertId: number) => {
    try {
      await deleteFamilyAlert(family.familyId, alertId);
      onFamilyChange({
        ...family,
        alerts: familyAlerts.filter((alert) => alert.alertId !== alertId),
      });
      await onReload();
      publishAlertTimesChanged();
      toast.success("가족 알림 시간이 삭제되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const handleToggleFamilyAlert = async () => {
    const next = !familyAlertEnabled;
    setFamilyAlertEnabled(next);
    onFamilyChange({ ...family, alertEnabled: next });

    try {
      await toggleFamilyAlert(family.familyId, next);
      publishAlertTimesChanged();
    } catch (err) {
      setFamilyAlertEnabled(family.alertEnabled);
      onFamilyChange(family);
      toast.error(parseError(err));
    }
  };

  return (
    <div className="flex w-full flex-col overflow-x-clip bg-[#f2f4f6] px-5 pb-8 pt-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton onBack={onBack} />
      </div>

      <section className="shrink-0 overflow-hidden rounded-[16px] bg-white">
        <div className="flex items-center gap-4 p-5">
          <Avatar size="large" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[28px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#191f28]">
              {family.name}님
            </h1>
            <p className="mt-1 text-[17px] font-semibold leading-[1.24] tracking-[-0.01em] text-[#191f28]">
              나이 {family.age}세
            </p>
          </div>
        </div>

        <FamilyLocationRow
          kind="home"
          label="거주지역"
          location={home}
          editing={editingLocType === "HOME"}
          sidoList={sidoList}
          editingAreaNo={editingAreaNo}
          onChange={setEditingAreaNo}
          onEdit={() => {
            setEditingLocType("HOME");
            setEditingAreaNo("");
          }}
          onCancel={() => setEditingLocType(null)}
          onSave={() => saveLocation("HOME")}
        />
        <FamilyLocationRow
          kind="work"
          label="직장/학교"
          location={work}
          editing={editingLocType === "WORK"}
          sidoList={sidoList}
          editingAreaNo={editingAreaNo}
          onChange={setEditingAreaNo}
          onEdit={() => {
            setEditingLocType("WORK");
            setEditingAreaNo("");
          }}
          onCancel={() => setEditingLocType(null)}
          onSave={() => saveLocation("WORK")}
        />
      </section>

      <section className="mt-4 shrink-0 rounded-[16px] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-[#191f28]">
              알림 시간
            </h2>
            <p className="mt-1 text-[13px] font-medium leading-tight tracking-[-0.01em] text-[#8b95a1]">
              가족 알림 수신
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={familyAlertEnabled} onClick={handleToggleFamilyAlert} />
            <button
              type="button"
              aria-label="알림 추가"
              onClick={() => {
                setEditingAlertId(null);
                setIsAddingAlert((value) => !value);
              }}
              className={`grid h-10 w-10 place-items-center rounded-full bg-[#f2f4f6] text-[24px] font-light leading-none text-[#3182f6] transition-all active:scale-[0.92] ${
                isAddingAlert ? "rotate-45" : ""
              }`}
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-[#f2f4f6]" />

        {isAddingAlert && (
          <div className="flex flex-wrap items-center gap-3 border-b border-[#f2f4f6] py-5">
            <input
              type="time"
              value={newAlertTime}
              onChange={(event) => setNewAlertTime(event.target.value)}
              className="w-auto shrink-0 bg-transparent text-[28px] font-semibold leading-none tracking-[-0.28px] text-[#191f28] outline-none"
            />
            <LocationToggle value={newAlertLocationType} onChange={setNewAlertLocationType} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addAlert}
                className="rounded-full bg-[#3182f6] px-4 py-2 text-[14px] font-normal tracking-[-0.01em] text-white transition-transform active:scale-[0.98]"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setIsAddingAlert(false)}
                className="text-[14px] font-normal tracking-[-0.01em] text-[#8b95a1] transition-transform active:scale-[0.98]"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {familyAlerts.length === 0 ? (
          <p className="py-7 text-center text-[15px] font-medium tracking-[-0.01em] text-[#8b95a1]">
            설정한 알림이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col">
            {familyAlerts.map((alert) => (
              <FamilyAlertRow
                key={alert.alertId}
                alert={alert}
                editing={editingAlertId === alert.alertId}
                editingTime={editingAlertTime}
                editingLocationType={editingAlertLocationType}
                onStartEdit={() => {
                  setIsAddingAlert(false);
                  startEditAlert(alert);
                }}
                onCancel={() => setEditingAlertId(null)}
                onTimeChange={setEditingAlertTime}
                onLocationChange={setEditingAlertLocationType}
                onSave={() => saveAlert(alert.alertId)}
                onDelete={() => removeAlert(alert.alertId)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 shrink-0 rounded-[16px] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-[#191f28]">
            건강 상태
          </h2>
          {conditionsDirty && (
            <button
              type="button"
              onClick={saveConditions}
              disabled={selectedIds.length === 0}
              className="rounded-[12px] bg-[#3182f6] px-4 py-2 text-[14px] font-semibold leading-none tracking-[-0.01em] text-white transition-transform active:enabled:scale-95 active:bg-[#2272eb] disabled:opacity-40"
            >
              저장
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {healthOptions.map((condition) => (
            <ConditionCard
              key={condition.value}
              label={condition.label}
              selected={selectedIds.includes(condition.value)}
              onClick={() => toggleCondition(condition.value)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FamilyLocationRow({
  kind,
  label,
  location,
  editing,
  sidoList,
  editingAreaNo,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: {
  kind: "home" | "work";
  label: string;
  location?: Location;
  editing: boolean;
  sidoList: string[];
  editingAreaNo: string;
  onChange: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="border-t border-[#f2f4f6] px-5 py-3.5">
      <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f2f4f6] text-[#4e5968]">
          {kind === "home" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="11" height="18" rx="1" />
              <path d="M15 8h4a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4" />
              <path d="M8 7h3M8 11h3M8 15h3" />
            </svg>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold leading-tight tracking-[-0.01em] text-[#8b95a1]">
            {label}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[#191f28]">
            {formatLocation(location)}
          </p>
        </div>
        <button
          type="button"
          aria-label={`${label} 수정`}
          onClick={editing ? onCancel : onEdit}
          className="shrink-0 rounded-full bg-[#f2f4f6] px-3 py-1.5 text-[13px] font-semibold leading-none text-[#4e5968] transition-transform active:scale-[0.95]"
        >
          {editing ? "취소" : "수정"}
        </button>
      </div>
      {editing && (
        <div className="mt-3 flex flex-col gap-3">
          <RegionSelect
            className={selectClass}
            value={editingAreaNo}
            onChange={onChange}
            sidoList={sidoList}
          />
          <button
            type="button"
            onClick={onSave}
            disabled={!editingAreaNo}
            className="w-full rounded-[14px] bg-[#3182f6] py-3 text-[15px] font-semibold leading-none tracking-[-0.01em] text-white transition-transform active:enabled:scale-[0.98] active:bg-[#2272eb] disabled:opacity-40"
          >
            저장
          </button>
        </div>
      )}
    </div>
  );
}

function FamilyAlertRow({
  alert,
  editing,
  editingTime,
  editingLocationType,
  onStartEdit,
  onCancel,
  onTimeChange,
  onLocationChange,
  onSave,
  onDelete,
}: {
  alert: Alert;
  editing: boolean;
  editingTime: string;
  editingLocationType: AlertLocationType;
  onStartEdit: () => void;
  onCancel: () => void;
  onTimeChange: (value: string) => void;
  onLocationChange: (value: AlertLocationType) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="border-b border-[#f2f4f6] py-5 last:border-b-0">
      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="time"
              value={editingTime}
              onChange={(event) => onTimeChange(event.target.value)}
              className="w-auto shrink-0 bg-transparent text-[28px] font-semibold leading-none tracking-[-0.28px] text-[#191f28] outline-none"
            />
            <LocationToggle value={editingLocationType} onChange={onLocationChange} />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onDelete}
              className="text-[14px] font-normal tracking-[-0.01em] text-[#8b95a1] transition-transform active:scale-[0.98]"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[14px] font-normal tracking-[-0.01em] text-[#8b95a1] transition-transform active:scale-[0.98]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-full bg-[#3182f6] px-4 py-2 text-[14px] font-normal tracking-[-0.01em] text-white transition-transform active:scale-[0.98]"
            >
              완료
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 max-[360px]:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.28px] text-[#191f28] max-[360px]:text-[30px]">
              {alert.alertTime}
            </span>
            <LocationBadge locationType={alert.locationType} />
          </div>
          <button
            type="button"
            onClick={onStartEdit}
            className="text-[17px] font-normal tracking-[-0.01em] text-[#3182f6] transition-transform active:scale-[0.98] max-[360px]:text-[15px]"
          >
            편집
          </button>
        </div>
      )}
    </li>
  );
}

function LocationBadge({ locationType }: { locationType: Alert["locationType"] }) {
  return (
    <span className="rounded-full bg-[#f2f4f6] px-2 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em] text-[#191f28]">
      {locationLabel[locationType === "WORK" ? "WORK" : "HOME"]}
    </span>
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

function Avatar({ size = "normal" }: { size?: "normal" | "large" }) {
  const boxSize = size === "large" ? "h-20 w-20" : "h-12 w-12";
  const headSize = size === "large" ? "h-10 w-10 top-[13px]" : "h-6 w-6 top-2";
  const bodySize = size === "large" ? "h-7 w-14 bottom-[13px]" : "h-5 w-9 bottom-2";

  return (
    <div className={`relative shrink-0 rounded-full bg-[#f2f4f6] ${boxSize}`}>
      <div className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[#8b95a1] ${headSize}`} />
      <div className={`absolute left-1/2 -translate-x-1/2 rounded-t-full bg-[#8b95a1] ${bodySize}`} />
    </div>
  );
}

function ConditionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isNoCondition = label === "질병없음";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex aspect-square min-h-26.5 flex-col items-center justify-center gap-2 rounded-[16px] border bg-white p-2 text-center transition-transform active:scale-[0.97]",
        selected ? "border-[#3182f6] bg-[#f4f9ff]" : "border-transparent bg-[#f2f4f6]",
      ].join(" ")}
    >
      {selected && (
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#3182f6] text-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      )}
      <div className="grid h-12 w-12 place-items-center">
        {isNoCondition ? (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[22px] font-bold leading-none text-[#8b95a1]">
            0
          </span>
        ) : (
          <IllnessIcon index={getConditionIconIndex(label)} scale={0.115} />
        )}
      </div>
      <span
        className={`text-[14px] font-semibold leading-tight tracking-[-0.01em] ${
          selected ? "text-[#3182f6]" : "text-[#4e5968]"
        }`}
      >
        {label}
      </span>
    </button>
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
        className={`absolute top-1/2 h-6.5 w-6.5 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all ${
          checked ? "right-0.75" : "left-0.75"
        }`}
      />
    </button>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="뒤로"
      className="-ml-1 flex items-center gap-1 rounded-full py-1 pr-2 text-[15px] font-semibold leading-none tracking-[-0.01em] text-[#4e5968] transition-transform active:scale-[0.97]"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      가족
    </button>
  );
}
