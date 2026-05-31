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
  "border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] cursor-pointer";

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
    <div className="flex min-h-full w-full flex-col overflow-x-clip bg-white px-5 pb-8 pt-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.374px] text-[#1d1d1f]">
            가족
          </h1>
          <p className="mt-3 text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-[#1d1d1f]">
            내 가족 그룹
          </p>
        </div>
        <button
          type="button"
          aria-label="가족 추가"
          onClick={() => setIsAdding((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full bg-[#0066cc] text-[30px] font-light leading-none text-white transition-transform active:scale-95"
        >
          +
        </button>
      </section>

      {isAdding && (
        <section className="mt-4 rounded-[18px] border border-[#e0e0e0] bg-white p-4">
          <label className="text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
            가족 로그인 ID
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={relativeLoginId}
              onChange={(event) => setRelativeLoginId(event.target.value)}
              placeholder="papa123"
              className="min-w-0 flex-1 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-5 py-[10px] text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
            <button
              type="button"
              onClick={handleAddFamily}
              className="rounded-full bg-[#0066cc] px-4 text-[14px] font-normal leading-none tracking-[-0.224px] text-white transition-transform active:scale-95"
            >
              추가
            </button>
          </div>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-3">
        {loading ? (
          <p className="py-7 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
            불러오는 중...
          </p>
        ) : families.length === 0 ? (
          <p className="py-7 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
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
    <article className="rounded-[8px] border border-[#e0e0e0] bg-white p-3">
      <div className="grid grid-cols-[56px_1fr_auto] items-center gap-3">
        <Avatar />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[18px] font-semibold leading-tight tracking-[-0.374px] text-[#1d1d1f]">
              {family.name}님
            </p>
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold leading-tight tracking-[-0.12px] text-[#7a7a7a]">
            {normalizeConditionName(primaryCondition)}
          </p>
          {(family.alertTimes?.length ?? 0) > 0 && (
            <p className="mt-1 truncate text-[12px] font-semibold leading-tight tracking-[-0.12px] text-[#0066cc]">
              알림 {family.alertTimes.join(", ")}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label={`${family.name} 프로필 보기`}
          onClick={onOpen}
          className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#0066cc] text-[20px] leading-none text-[#0066cc] transition-transform active:scale-95"
        >
          ✎
        </button>
      </div>
    </article>
  );
}

function FamilyProfileSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-full w-full flex-col overflow-x-clip bg-white px-5 pb-8 pt-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full px-1 text-[17px] font-semibold leading-none tracking-[-0.374px] text-[#0066cc] transition-transform active:scale-95"
        >
          ‹ 가족
        </button>
      </div>
      <section className="rounded-[18px] border border-[#e0e0e0] bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-[#f5f5f7]" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-32 animate-pulse rounded bg-[#f5f5f7]" />
            <div className="h-5 w-20 animate-pulse rounded bg-[#f5f5f7]" />
          </div>
        </div>
      </section>
      <div className="mt-5 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-[12px] bg-[#f5f5f7]" />
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
    <div className="flex min-h-full w-full flex-col overflow-x-clip bg-white px-5 pb-8 pt-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full px-1 text-[17px] font-semibold leading-none tracking-[-0.374px] text-[#0066cc] transition-transform active:scale-95"
        >
          ‹ 가족
        </button>
      </div>

      <section className="shrink-0 overflow-hidden rounded-[18px] border border-[#e0e0e0] bg-white">
        <div className="flex items-center gap-4 p-5">
          <Avatar size="large" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[28px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#1d1d1f]">
              {family.name}님
            </h1>
            <p className="mt-1 text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-[#1d1d1f]">
              나이 {family.age}세
            </p>
          </div>
        </div>

        <FamilyLocationRow
          icon="🏠"
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
          icon="🏢"
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

      <section className="mt-5 shrink-0 border-t border-[#f0f0f0] pt-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
              알림 시간
            </h2>
            <p className="mt-1 text-[13px] font-normal leading-tight tracking-[-0.12px] text-[#7a7a7a]">
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
              className="grid h-11 w-11 place-items-center rounded-full text-[34px] font-light leading-none text-[#0066cc] transition-transform active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-[#e0e0e0]" />

        {isAddingAlert && (
          <div className="flex flex-wrap items-center gap-3 border-b border-[#e0e0e0] py-5">
            <input
              type="time"
              value={newAlertTime}
              onChange={(event) => setNewAlertTime(event.target.value)}
              className="w-[110px] shrink-0 bg-transparent text-[28px] font-semibold leading-none tracking-[-0.28px] text-[#1d1d1f] outline-none"
            />
            <LocationToggle value={newAlertLocationType} onChange={setNewAlertLocationType} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addAlert}
                className="rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-normal tracking-[-0.224px] text-white transition-transform active:scale-95"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setIsAddingAlert(false)}
                className="text-[14px] font-normal tracking-[-0.224px] text-[#7a7a7a] transition-transform active:scale-95"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {familyAlerts.length === 0 ? (
          <p className="border-b border-[#e0e0e0] py-7 text-[17px] font-normal tracking-[-0.374px] text-[#7a7a7a]">
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

      <section className="mt-5 shrink-0 border-t border-[#f0f0f0] pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[24px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
            건강 상태
          </h2>
          {conditionsDirty && (
            <button
              type="button"
              onClick={saveConditions}
              disabled={selectedIds.length === 0}
              className="rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-normal leading-none tracking-[-0.224px] text-white transition-transform active:enabled:scale-95 disabled:opacity-40"
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
  icon,
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
  icon: string;
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
    <div className="border-t border-[#e0e0e0] px-5 py-3">
      <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3">
        <span className="text-[24px] leading-none">{icon}</span>
        <span className="text-[21px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
          {label} :
        </span>
        <span className="min-w-0 truncate text-[20px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
          {formatLocation(location)}
        </span>
        <button
          type="button"
          aria-label={`${label} 수정`}
          onClick={editing ? onCancel : onEdit}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-[#0066cc] text-[20px] leading-none text-[#0066cc] transition-transform active:scale-95"
        >
          {editing ? "×" : "✎"}
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
            className="w-full rounded-full bg-[#0066cc] py-2.5 text-[17px] leading-none tracking-[-0.374px] text-white transition-transform active:enabled:scale-95 disabled:opacity-40"
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
    <li className="border-b border-[#e0e0e0] py-5">
      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="time"
              value={editingTime}
              onChange={(event) => onTimeChange(event.target.value)}
              className="w-[110px] shrink-0 bg-transparent text-[28px] font-semibold leading-none tracking-[-0.28px] text-[#1d1d1f] outline-none"
            />
            <LocationToggle value={editingLocationType} onChange={onLocationChange} />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onDelete}
              className="text-[14px] font-normal tracking-[-0.224px] text-[#7a7a7a] transition-transform active:scale-95"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[14px] font-normal tracking-[-0.224px] text-[#7a7a7a] transition-transform active:scale-95"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-normal tracking-[-0.224px] text-white transition-transform active:scale-95"
            >
              완료
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 max-[360px]:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.28px] text-[#1d1d1f] max-[360px]:text-[30px]">
              {alert.alertTime}
            </span>
            <LocationBadge locationType={alert.locationType} />
          </div>
          <button
            type="button"
            onClick={onStartEdit}
            className="text-[17px] font-normal tracking-[-0.374px] text-[#0066cc] transition-transform active:scale-95 max-[360px]:text-[15px]"
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
    <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[11px] font-semibold leading-none tracking-[-0.12px] text-[#1d1d1f]">
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

function Avatar({ size = "normal" }: { size?: "normal" | "large" }) {
  const boxSize = size === "large" ? "h-20 w-20" : "h-12 w-12";
  const headSize = size === "large" ? "h-10 w-10 top-[13px]" : "h-6 w-6 top-2";
  const bodySize = size === "large" ? "h-7 w-14 bottom-[13px]" : "h-5 w-9 bottom-2";

  return (
    <div className={`relative shrink-0 rounded-full bg-[#f5f5f7] ${boxSize}`}>
      <div className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[#7a7a7a] ${headSize}`} />
      <div className={`absolute left-1/2 -translate-x-1/2 rounded-t-full bg-[#7a7a7a] ${bodySize}`} />
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
        "relative flex aspect-square min-h-[106px] flex-col items-center justify-center rounded-[8px] border bg-white p-2 text-center transition-transform active:scale-95",
        selected ? "border-[#0066cc]" : "border-[#e0e0e0]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-[4px] border text-[16px] leading-none",
          selected ? "border-[#0066cc] text-[#0066cc]" : "border-[#7a7a7a] text-transparent",
        ].join(" ")}
      >
        ✓
      </span>
      <div className="mb-1 grid h-[54px] w-[54px] place-items-center">
        {isNoCondition ? (
          <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#f5f5f7] text-[24px] font-semibold leading-none text-[#7a7a7a]">
            0
          </span>
        ) : (
          <IllnessIcon index={getConditionIconIndex(label)} scale={0.125} />
        )}
      </div>
      <span
        className={`text-[12px] font-semibold leading-tight tracking-[-0.12px] ${
          selected ? "text-[#0066cc]" : "text-[#7a7a7a]"
        }`}
      >
        {selected ? "선택됨" : "선택 안됨"}
      </span>
      <span className="mt-1 text-[15px] font-semibold leading-tight tracking-[-0.224px] text-[#1d1d1f]">
        {label}
      </span>
    </button>
  );
}

function Switch({
  checked,
  onClick,
  compact = false,
}: {
  checked: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={`relative shrink-0 rounded-full border-2 transition-colors active:scale-95 ${
        compact ? "h-7 w-[52px]" : "h-10 w-[74px]"
      } ${checked ? "border-[#1d1d1f] bg-[#1d1d1f]" : "border-[#d2d2d7] bg-white"}`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-all ${
          compact ? "h-5 w-5" : "h-8 w-8"
        } ${checked ? "right-0.5 bg-white" : "left-0.5 bg-[#1d1d1f]"}`}
      />
    </button>
  );
}
