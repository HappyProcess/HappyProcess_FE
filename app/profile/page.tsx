'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  modifyMyInformation,
  updateMyConditions,
  addMyLocation,
  deleteMyLocation,
  logout,
} from "#/service/member";
import {
  getCachedProfile,
  getCachedConditions,
  getCachedLocations,
  getCachedSido,
  invalidateConditions,
  invalidateLocations,
  invalidateProfile,
} from "#/lib/cache";
import { type Location, type Condition, type Profile } from "#/service/types";
import RegionSelect from "@/components/RegionSelectBoxes";
import IllnessIcon from "@/components/IconComponents/IllnessIcon";
import { parseError } from "#/lib/parseError";
import { getYearOptions, healthOptions, NO_CONDITION_ID } from "@/register/Options";
import { getConditionIconIndex } from "@/constants/conditionIconMap";

const inputClass =
  "w-full border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] leading-[1.47] tracking-[-0.374px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]";
const selectClass =
  "border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] cursor-pointer";
const labelClass = "text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]";

type BasicFormValues = {
  name: string;
  birth: string;
};

const LOCATION_LABEL: Record<"HOME" | "WORK", string> = {
  HOME: "거주지역",
  WORK: "직장/학교",
};

const normalizeConditionId = (condition: Condition) =>
  healthOptions.find((option) => option.label === condition.conditionName)?.value ??
  condition.conditionId;

const getAge = (birth: string) => {
  const birthDate = new Date(birth);
  if (Number.isNaN(birthDate.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hadBirthday) age -= 1;
  return String(age);
};

const formatLocation = (location?: Location) =>
  location ? `${location.sido} ${location.sigungu} ${location.dong}` : "미설정";

const formatProfileName = (name: string) => name.replace(/^\d+/, "");

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myConditionIds, setMyConditionIds] = useState<number[]>([]);
  const [savedConditionIds, setSavedConditionIds] = useState<number[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sidoList, setSidoList] = useState<string[]>([]);
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingLocType, setEditingLocType] = useState<"HOME" | "WORK" | null>(null);
  const [editingAreaNo, setEditingAreaNo] = useState("");

  const { register, handleSubmit, reset } = useForm<BasicFormValues>();

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    Promise.all([
      getCachedProfile(),
      getCachedConditions(),
      getCachedLocations(),
      getCachedSido(),
    ]).then(([prof, mine, locs, sido]) => {
      setProfile(prof);
      const ids = mine.map(normalizeConditionId);
      setMyConditionIds(ids);
      setSavedConditionIds(ids);
      setLocations(locs);
      setSidoList(sido);
      reset({
        name: formatProfileName(prof.name),
        birth: prof.birth,
      });
    }).catch(() => {
      router.push("/login");
    });
  }, [reset, router]);

  const onSaveBasic = async (data: BasicFormValues) => {
    try {
      await modifyMyInformation(data);
      setProfile((p) => p ? { ...p, ...data } : p);
      localStorage.setItem("userName", data.name);
      invalidateProfile();
      window.dispatchEvent(new Event("userNameUpdated"));
      setEditingBasic(false);
      toast.success("기본 정보가 수정되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const onCancelBasic = () => {
    reset({
      name: profile ? formatProfileName(profile.name) : "",
      birth: profile?.birth ?? "",
    });
    setEditingBasic(false);
  };

  const toggleCondition = (id: number) => {
    setMyConditionIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (id === NO_CONDITION_ID) return [NO_CONDITION_ID];
      return [...prev.filter((c) => c !== NO_CONDITION_ID), id];
    });
  };

  const onSaveConditions = async () => {
    try {
      await updateMyConditions(myConditionIds);
      setSavedConditionIds(myConditionIds);
      invalidateConditions();
      toast.success("건강 상태가 수정되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const onCancelConditions = () => {
    setMyConditionIds(savedConditionIds);
  };

  const conditionsDirty =
    myConditionIds.length !== savedConditionIds.length ||
    myConditionIds.some((id) => !savedConditionIds.includes(id));

  const onSaveLocation = async (locationType: "HOME" | "WORK") => {
    if (!editingAreaNo) {
      toast.error("지역을 선택해주세요.");
      return;
    }
    const existing = locations.find((l) => l.locationType === locationType);
    try {
      if (existing) await deleteMyLocation(existing.locationId);
      await addMyLocation({ locationType, areaNo: editingAreaNo });
      invalidateLocations();
      const updated = await getCachedLocations();
      setLocations(updated);
      setEditingLocType(null);
      setEditingAreaNo("");
      toast.success("위치가 수정되었습니다.");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const onStartEditLocation = (locationType: "HOME" | "WORK") => {
    setEditingLocType(locationType);
    setEditingAreaNo("");
  };

  if (!profile) {
    return (
      <div></div>
    );
  }

  const home = locations.find((location) => location.locationType === "HOME");
  const work = locations.find((location) => location.locationType === "WORK");

  return (
    <div className="flex w-full flex-col bg-white px-5 pb-8 pt-6">
      <section className="rounded-[18px] border border-[#e0e0e0] bg-white overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          <div className="relative h-20 w-20 shrink-0 rounded-full bg-[#f5f5f7]">
            <div className="absolute left-1/2 top-[13px] h-10 w-10 -translate-x-1/2 rounded-full bg-[#7a7a7a]" />
            <div className="absolute bottom-[13px] left-1/2 h-7 w-14 -translate-x-1/2 rounded-t-full bg-[#7a7a7a]" />
          </div>

          {editingBasic ? (
            <form onSubmit={handleSubmit(onSaveBasic)} className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>이름</label>
                  <input type="text" {...register("name")} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>출생연도</label>
                  <select {...register("birth")} className={selectClass}>
                    <option value="">선택</option>
                    {getYearOptions().map((year) => (
                      <option key={year} value={`${year}-01-01`}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-[#0066cc] py-2 text-[14px] font-normal leading-none tracking-[-0.224px] text-white transition-transform active:scale-95"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={onCancelBasic}
                  className="flex-1 rounded-full border border-[#0066cc] py-2 text-[14px] font-normal leading-none tracking-[-0.224px] text-[#0066cc] transition-transform active:scale-95"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[28px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#1d1d1f]">
                {formatProfileName(profile.name)}님
              </h1>
              <p className="mt-1 text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-[#1d1d1f]">
                나이 {getAge(profile.birth)}세
              </p>
            </div>
          )}

          {!editingBasic && (
            <button
              type="button"
              aria-label="기본 정보 수정"
              onClick={() => setEditingBasic(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-[#0066cc] text-[20px] leading-none text-[#0066cc] transition-transform active:scale-95"
            >
              ✎
            </button>
          )}
        </div>

        <ProfileLocationRow
          icon="🏠"
          label={LOCATION_LABEL.HOME}
          value={formatLocation(home)}
          editing={editingLocType === "HOME"}
          selectClass={selectClass}
          editingAreaNo={editingAreaNo}
          sidoList={sidoList}
          onChange={setEditingAreaNo}
          onEdit={() => onStartEditLocation("HOME")}
          onCancel={() => {
            setEditingLocType(null);
            setEditingAreaNo("");
          }}
          onSave={() => onSaveLocation("HOME")}
        />
        <ProfileLocationRow
          icon="🏢"
          label={LOCATION_LABEL.WORK}
          value={formatLocation(work)}
          editing={editingLocType === "WORK"}
          selectClass={selectClass}
          editingAreaNo={editingAreaNo}
          sidoList={sidoList}
          onChange={setEditingAreaNo}
          onEdit={() => onStartEditLocation("WORK")}
          onCancel={() => {
            setEditingLocType(null);
            setEditingAreaNo("");
          }}
          onSave={() => onSaveLocation("WORK")}
        />
      </section>

      <section className="mt-5 border-t border-[#f0f0f0] pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[24px] font-semibold leading-[1.19] tracking-[-0.374px] text-[#1d1d1f]">
            건강 상태
          </h2>
          {conditionsDirty && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelConditions}
                className="rounded-full border border-[#0066cc] px-4 py-2 text-[14px] font-normal leading-none tracking-[-0.224px] text-[#0066cc] transition-transform active:scale-95"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSaveConditions}
                disabled={myConditionIds.length === 0}
                className="rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-normal leading-none tracking-[-0.224px] text-white transition-transform active:enabled:scale-95 disabled:opacity-40"
              >
                저장
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {healthOptions.map((condition) => (
            <ConditionCard
              key={condition.value}
              label={condition.label}
              selected={myConditionIds.includes(condition.value)}
              onClick={() => toggleCondition(condition.value)}
            />
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-full border border-[#e0e0e0] py-2.5 text-[17px] leading-none tracking-[-0.374px] text-[#1d1d1f] transition-transform active:scale-95"
      >
        로그아웃
      </button>
    </div>
  );
}

function ProfileLocationRow({
  icon,
  label,
  value,
  editing,
  selectClass,
  editingAreaNo,
  sidoList,
  onChange,
  onEdit,
  onCancel,
  onSave,
}: {
  icon: string;
  label: string;
  value: string;
  editing: boolean;
  selectClass: string;
  editingAreaNo: string;
  sidoList: string[];
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
          {value}
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
        "relative flex aspect-square min-h-[112px] flex-col items-center justify-center rounded-[8px] border bg-white p-2 text-center transition-transform active:scale-95",
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

      <div className="mb-1 grid h-[58px] w-[58px] place-items-center">
        {isNoCondition ? (
          <span className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#f5f5f7] text-[24px] font-semibold leading-none text-[#7a7a7a]">
            0
          </span>
        ) : (
          <IllnessIcon index={getConditionIconIndex(label)} scale={0.135} />
        )}
      </div>
      <span
        className={`text-[12px] font-semibold leading-tight tracking-[-0.12px] ${
          selected ? "text-[#0066cc]" : "text-[#7a7a7a]"
        }`}
      >
        {selected ? "선택됨" : "선택 안됨"}
      </span>
      <span className="mt-1 text-[17px] font-semibold leading-tight tracking-[-0.374px] text-[#1d1d1f]">
        {label}
      </span>
    </button>
  );
}
