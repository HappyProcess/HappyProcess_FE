'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  modifyMyInformation,
  updateMyConditions,
  addMyLocation,
  deleteMyLocation,
  getMyLocations,
  logout,
} from "#/service/member";
import {
  getCachedProfile,
  getCachedAllConditions,
  getCachedConditions,
  getCachedLocations,
  getCachedSido,
  invalidateConditions,
  invalidateLocations,
  invalidateProfile,
} from "#/lib/cache";
import { type Location, type Condition, type Profile } from "#/service/types";
import RegionSelect from "@/components/RegionSelectBoxes";
import { parseError } from "#/lib/parseError";
import { commuteOptions, getYearOptions } from "@/register/Options";

const inputClass =
  "w-full border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] leading-[1.47] tracking-[-0.374px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]";
const selectClass =
  "border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] cursor-pointer";
const labelClass = "text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]";
const sectionClass = "flex flex-col gap-5 py-6 border-b border-[#f0f0f0]";

type BasicFormValues = {
  name: string;
  birth: string;
  commuteTime: string;
};

type LocationFormValues = {
  locationType: "HOME" | "WORK";
  areaNo: string;
};

const LOCATION_LABEL: Record<"HOME" | "WORK", string> = {
  HOME: "거주지역",
  WORK: "직장/학교",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allConditions, setAllConditions] = useState<Condition[]>([]);
  const [myConditionIds, setMyConditionIds] = useState<number[]>([]);
  const [savedConditionIds, setSavedConditionIds] = useState<number[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sidoList, setSidoList] = useState<string[]>([]);
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingLocType, setEditingLocType] = useState<"HOME" | "WORK" | null>(null);
  const [editingAreaNo, setEditingAreaNo] = useState("");

  const { register, handleSubmit, reset, control } = useForm<BasicFormValues>();

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    Promise.all([
      getCachedProfile(),
      getCachedAllConditions(),
      getCachedConditions(),
      getCachedLocations(),
      getCachedSido(),
    ]).then(([prof, all, mine, locs, sido]) => {
      setProfile(prof);
      setAllConditions(all);
      const ids = mine.map((c) => c.conditionId);
      setMyConditionIds(ids);
      setSavedConditionIds(ids);
      setLocations(locs);
      setSidoList(sido);
      reset({
        name: prof.name,
        birth: prof.birth,
        commuteTime: prof.commuteTime ?? "",
      });
    }).catch(() => {
      router.push("/login");
    });
  }, []);

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
      name: profile?.name ?? "",
      birth: profile?.birth ?? "",
      commuteTime: profile?.commuteTime ?? "",
    });
    setEditingBasic(false);
  };

  const NO_CONDITION_ID = 1;

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

  return (
    <div className="w-full px-8 py-10 flex flex-col">
        <h1 className="text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] text-center">
          프로필
        </h1>

        {/* 기본 정보 */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-[21px] font-semibold tracking-[0.231px] text-[#1d1d1f]">기본 정보</h2>
            {!editingBasic && (
              <button
                onClick={() => setEditingBasic(true)}
                className="text-[14px] text-[#0066cc] tracking-[-0.224px] cursor-pointer"
              >
                수정
              </button>
            )}
          </div>

          {editingBasic ? (
            <form onSubmit={handleSubmit(onSaveBasic)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>이름</label>
                <input type="text" {...register("name")} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>출생연도</label>
                <select {...register("birth")} className={selectClass}>
                  <option value="">출생연도 선택</option>
                  {getYearOptions().map((y) => (
                    <option key={y} value={`${y}-01-01`}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>알림시간</label>
                <select {...register("commuteTime")} className={selectClass}>
                  <option value="">알림시간 선택</option>
                  {commuteOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="submit"
                  className="flex-1 bg-[#0066cc] text-white rounded-full py-2.5 text-[17px] leading-none cursor-pointer active:scale-95 transition-transform"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={onCancelBasic}
                  className="flex-1 bg-transparent text-[#0066cc] border border-[#0066cc] rounded-full py-2.5 text-[17px] leading-none cursor-pointer active:scale-95 transition-transform"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-3">
              <InfoRow label="아이디" value={profile.loginId} />
              <InfoRow label="이름" value={profile.name} />
              <InfoRow label="생년월일" value={profile.birth} />
              <InfoRow label="알림시간" value={profile.commuteTime || "미설정"} />
            </dl>
          )}
        </section>

        {/* 건강 상태 */}
        <section className={sectionClass}>
          <h2 className="text-[21px] font-semibold tracking-[0.231px] text-[#1d1d1f]">건강 상태</h2>

          <div className="flex flex-wrap gap-2">
            {allConditions.map((c) => {
              const selected = myConditionIds.includes(c.conditionId);
              return (
                <button
                  key={c.conditionId}
                  type="button"
                  onClick={() => toggleCondition(c.conditionId)}
                  className={[
                    "px-4 py-2 rounded-full text-[14px] tracking-[-0.224px] transition-colors cursor-pointer active:scale-95",
                    selected
                      ? "bg-[#0066cc] text-white"
                      : "bg-white border border-[#e0e0e0] text-[#1d1d1f]",
                  ].join(" ")}
                >
                  {c.conditionName}
                </button>
              );
            })}
            {allConditions.length === 0 && (
              <span className="text-[17px] text-[#7a7a7a]">건강 상태 없음</span>
            )}
          </div>

          {conditionsDirty && (
            <div className="flex gap-3 pt-2 border-t border-[#e0e0e0]">
              <button
                onClick={onSaveConditions}
                disabled={myConditionIds.length === 0}
                className="flex-1 bg-[#0066cc] text-white rounded-full py-2.5 text-[17px] leading-none transition-transform disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:enabled:scale-95"
              >
                저장
              </button>
              <button
                onClick={onCancelConditions}
                className="flex-1 bg-transparent text-[#0066cc] border border-[#0066cc] rounded-full py-2.5 text-[17px] leading-none cursor-pointer active:scale-95 transition-transform"
              >
                취소
              </button>
            </div>
          )}
        </section>

        {/* 위치 */}
        <section className={sectionClass}>
          <h2 className="text-[21px] font-semibold tracking-[0.231px] text-[#1d1d1f]">위치</h2>

          <div className="flex flex-col gap-4">
            {(["HOME", "WORK"] as const).map((type) => {
              const loc = locations.find((l) => l.locationType === type);
              const isEditing = editingLocType === type;
              return (
                <div key={type} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-[#f5f5f7] rounded-[11px] px-4 py-3">
                    <div>
                      <span className="text-[12px] font-semibold text-[#0066cc] mr-2">
                        {LOCATION_LABEL[type]}
                      </span>
                      <span className="text-[17px] text-[#1d1d1f] tracking-[-0.374px]">
                        {loc ? `${loc.sido} ${loc.sigungu} ${loc.dong}` : "미설정"}
                      </span>
                    </div>
                    <button
                      onClick={() => isEditing ? (setEditingLocType(null), setEditingAreaNo("")) : onStartEditLocation(type)}
                      className="text-[14px] text-[#0066cc] tracking-[-0.224px] cursor-pointer ml-3 shrink-0"
                    >
                      {isEditing ? "취소" : "수정"}
                    </button>
                  </div>

                  {isEditing && (
                    <div className="flex flex-col gap-3 px-1">
                      <RegionSelect
                        className={selectClass}
                        value={editingAreaNo}
                        onChange={setEditingAreaNo}
                        sidoList={sidoList}
                      />
                      <button
                        onClick={() => onSaveLocation(type)}
                        disabled={!editingAreaNo}
                        className="w-full bg-[#0066cc] text-white rounded-full py-2.5 text-[17px] leading-none transition-transform disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:enabled:scale-95"
                      >
                        저장
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="pt-8 pb-2">
          <button
            onClick={onLogout}
            className="w-full border border-[#e0e0e0] text-[#1d1d1f] rounded-full py-2.5 text-[17px] leading-none cursor-pointer active:scale-95 transition-transform"
          >
            로그아웃
          </button>
        </div>

    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <dt className={labelClass}>{label}</dt>
      <dd className="text-[17px] text-[#1d1d1f] tracking-[-0.374px] leading-[1.47]">{value}</dd>
    </div>
  );
}
