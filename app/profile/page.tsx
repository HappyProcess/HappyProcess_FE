'use client'
import { useEffect, useRef, useState } from "react";
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
import { type Location, type Condition, type Profile, type PrecipPreference } from "#/service/types";
import RegionSelect from "@/components/RegionSelectBoxes";
import IllnessIcon from "@/components/IconComponents/IllnessIcon";
import { parseError } from "#/lib/parseError";
import { getYearOptions, healthOptions, NO_CONDITION_ID } from "@/register/Options";
import { getConditionIconIndex } from "@/constants/conditionIconMap";

const inputClass =
  "w-full border border-[#e5e8eb] rounded-[14px] px-4 py-3.5 text-[17px] text-[#191f28] leading-[1.47] tracking-[-0.01em] bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6]";
const selectClass =
  "border border-[#e5e8eb] rounded-[14px] px-4 py-3.5 text-[17px] text-[#191f28] bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6] cursor-pointer";
const labelClass = "text-[14px] font-semibold tracking-[-0.01em] text-[#191f28]";
// 회색 고스트 pill 버튼 공용 스타일 (수정/변경 등) — 한 곳에서 관리해 크기가 갈라지지 않게
const pillButton =
  "shrink-0 rounded-full bg-[#f2f4f6] px-4 py-2 text-[14px] font-semibold text-[#4e5968] transition-transform active:scale-[0.95]";

type BasicFormValues = {
  name: string;
  birth: string;
};

// 하이픈 없는 휴대폰 번호 (010/011/016/017/018/019 + 7~8자리)
const PHONE_REGEX = /^01[016789]\d{7,8}$/;

const PRECIP_OPTIONS: { value: PrecipPreference; label: string }[] = [
  { value: "NONE", label: "없음" },
  { value: "RAIN", label: "비" },
  { value: "SNOW", label: "눈" },
];

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

  // 문자(SMS) 알림 설정
  const [phoneInput, setPhoneInput] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [savedPhone, setSavedPhone] = useState("");
  const [savedSms, setSavedSms] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingSms, setSavingSms] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  // 강수 비선호 (질병 없는 사용자 날씨 점수에 반영). 토글 즉시 저장.
  const [precipPreference, setPrecipPreference] = useState<PrecipPreference>("NONE");
  const [savingPrecip, setSavingPrecip] = useState(false);

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
      // PR #46 배포 전 응답에 필드 없을 수 있어 방어
      const phone = prof.phoneNumber ?? "";
      const sms = prof.smsEnabled ?? false;
      setPhoneInput(phone);
      setSavedPhone(phone);
      setSmsEnabled(sms);
      setSavedSms(sms);
      setPrecipPreference(prof.precipPreference ?? "NONE");
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

  const onChangePhone = (value: string) => {
    setPhoneInput(value.replace(/[^0-9]/g, "").slice(0, 11)); // 하이픈 등 제거, 숫자만 11자
    setPhoneError(null);
  };

  // 토글은 즉시 반영(낙관적 + 저장). 실패 시 원복.
  const persistSms = async (nextEnabled: boolean, phone: string, commitPhone: boolean) => {
    const prevEnabled = smsEnabled;
    setSmsEnabled(nextEnabled);
    setSavingSms(true);
    try {
      await modifyMyInformation({ phoneNumber: phone, smsEnabled: nextEnabled });
      setSavedSms(nextEnabled);
      if (commitPhone) {
        setSavedPhone(phone);
        setPhoneInput(phone);
      }
      setProfile((p) => (p ? { ...p, phoneNumber: phone, smsEnabled: nextEnabled } : p));
      invalidateProfile();
    } catch (err) {
      setSmsEnabled(prevEnabled);
      toast.error(parseError(err));
    } finally {
      setSavingSms(false);
    }
  };

  // 토글 ON은 유효한 번호가 있어야만 허용 (opt-in 가드)
  const onToggleSms = () => {
    if (savingSms) return;
    if (smsEnabled) {
      // 끄기 — 저장된 번호 그대로 두고 수신만 해제
      persistSms(false, savedPhone, false);
      return;
    }
    const trimmed = phoneInput.trim();
    if (trimmed === "") {
      toast.error("문자 수신은 휴대폰 번호 등록이 필요해요.");
      phoneRef.current?.focus();
      return;
    }
    if (!PHONE_REGEX.test(trimmed)) {
      setPhoneError("휴대폰 번호 형식을 확인해주세요.");
      phoneRef.current?.focus();
      return;
    }
    // 켜기 — 입력한 번호도 함께 저장/커밋
    persistSms(true, trimmed, true);
  };

  // 취소/저장 버튼은 휴대폰 번호를 바꿨을 때만 노출 (토글은 즉시 반영되므로 제외)
  const smsDirty = phoneInput !== savedPhone;

  const onCancelSms = () => {
    setPhoneInput(savedPhone);
    setSmsEnabled(savedSms);
    setPhoneError(null);
  };

  const onSaveSms = async () => {
    const trimmed = phoneInput.trim();
    if (trimmed !== "" && !PHONE_REGEX.test(trimmed)) {
      setPhoneError("휴대폰 번호 형식을 확인해주세요.");
      phoneRef.current?.focus();
      return;
    }
    if (smsEnabled && trimmed === "") {
      toast.error("문자 수신은 휴대폰 번호 등록이 필요해요.");
      phoneRef.current?.focus();
      return;
    }
    setSavingSms(true);
    try {
      await modifyMyInformation({ phoneNumber: trimmed, smsEnabled });
      setSavedPhone(trimmed);
      setSavedSms(smsEnabled);
      setProfile((p) => (p ? { ...p, phoneNumber: trimmed, smsEnabled } : p));
      invalidateProfile();
      toast.success("알림 설정이 저장되었습니다.");
    } catch (err) {
      setPhoneError("휴대폰 번호 형식을 확인해주세요.");
      toast.error(parseError(err));
    } finally {
      setSavingSms(false);
    }
  };

  // 강수 비선호 선택 — 낙관적 반영 후 저장, 실패 시 원복.
  const onSelectPrecip = async (next: PrecipPreference) => {
    if (savingPrecip || next === precipPreference) return;
    const prev = precipPreference;
    setPrecipPreference(next);
    setSavingPrecip(true);
    try {
      await modifyMyInformation({ precipPreference: next });
      setProfile((p) => (p ? { ...p, precipPreference: next } : p));
      invalidateProfile();
    } catch (err) {
      setPrecipPreference(prev);
      toast.error(parseError(err));
    } finally {
      setSavingPrecip(false);
    }
  };

  if (!profile) {
    return (
      <div></div>
    );
  }

  const home = locations.find((location) => location.locationType === "HOME");
  const work = locations.find((location) => location.locationType === "WORK");

  return (
    <div className="flex w-full flex-col bg-[#f2f4f6] px-5 pb-10 pt-2">
      {/* 프로필 히어로 */}
      <section className="rounded-[16px] bg-white p-6 border border-[#e5e8eb]">
        {editingBasic ? (
          <form onSubmit={handleSubmit(onSaveBasic)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>이름</label>
                <input type="text" {...register("name")} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>출생연도</label>
                <select {...register("birth")} className={selectClass + " w-full"}>
                  <option value="">선택</option>
                  {getYearOptions().map((year) => (
                    <option key={year} value={`${year}-01-01`}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelBasic}
                className="flex-1 rounded-[14px] bg-[#f2f4f6] py-3.5 text-[15px] font-semibold text-[#4e5968] transition-transform active:scale-[0.98]"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 rounded-[14px] bg-[#3182f6] py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] active:bg-[#2272eb]"
              >
                저장
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-full bg-[#e8f3ff]">
              <div className="absolute left-1/2 top-3.5 h-8.5 w-8.5 -translate-x-1/2 rounded-full bg-[#3182f6]/70" />
              <div className="absolute bottom-2.5 left-1/2 h-6.5 w-13 -translate-x-1/2 rounded-t-full bg-[#3182f6]/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-[#191f28]">
                {formatProfileName(profile.name)}님
              </h1>
              <p className="mt-1 text-[15px] font-medium text-[#8b95a1]">
                나이 {getAge(profile.birth)}세
              </p>
            </div>
            <button
              type="button"
              aria-label="기본 정보 수정"
              onClick={() => setEditingBasic(true)}
              className={pillButton}
            >
              수정
            </button>
          </div>
        )}
      </section>

      {/* 내 동네 */}
      <section className="mt-3 overflow-hidden rounded-[16px] bg-white border border-[#e5e8eb]">
        <ProfileLocationRow
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
        <div className="mx-5 h-px bg-[#f2f4f6]" />
        <ProfileLocationRow
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

      {/* 알림 설정 (문자 수신) */}
      <section className="mt-3 flex flex-col gap-4 rounded-[16px] border border-[#e5e8eb] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[16px] font-bold tracking-[-0.01em] text-[#191f28]">
              위험 알림 문자 수신
            </p>
            <p className="mt-0.5 text-[13px] leading-[1.4] text-[#8b95a1]">
              휴대폰 번호를 등록하면 위험 알림을 문자로 받아요. 앱 알림은 항상 받아요.
            </p>
          </div>
          <Toggle on={smsEnabled} onClick={onToggleSms} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>휴대폰 번호</label>
          <input
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            value={phoneInput}
            onChange={(e) => onChangePhone(e.target.value)}
            placeholder="01012345678"
            className={`${inputClass} ${
              phoneError ? "border-[#f04452] focus:ring-[#f04452]" : ""
            }`}
          />
          {phoneError ? (
            <p className="text-[13px] font-medium text-[#f04452]">{phoneError}</p>
          ) : (
            <p className="text-[12px] text-[#8b95a1]">하이픈(-) 없이 숫자만 입력해요.</p>
          )}
        </div>

        {smsDirty && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelSms}
              className="flex-1 rounded-[14px] bg-[#f2f4f6] py-3.5 text-[15px] font-semibold text-[#4e5968] transition-transform active:scale-[0.98]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSaveSms}
              disabled={savingSms}
              className="flex-1 rounded-[14px] bg-[#3182f6] py-3.5 text-[15px] font-semibold text-white transition-transform active:enabled:scale-[0.98] active:enabled:bg-[#2272eb] disabled:opacity-40"
            >
              저장
            </button>
          </div>
        )}
      </section>

      {/* 강수 비선호 */}
      <section className="mt-3 flex flex-col gap-3 rounded-[16px] border border-[#e5e8eb] bg-white p-5">
        <div className="min-w-0">
          <p className="text-[16px] font-bold tracking-[-0.01em] text-[#191f28]">
            싫어하는 날씨
          </p>
          <p className="mt-0.5 text-[13px] leading-[1.4] text-[#8b95a1]">
            비나 눈을 선택하면 날씨 점수에 반영해드려요.
          </p>
        </div>
        <div className="flex gap-2 rounded-[12px] bg-[#f2f4f6] p-1">
          {PRECIP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectPrecip(option.value)}
              disabled={savingPrecip}
              aria-pressed={precipPreference === option.value}
              className={`flex-1 rounded-[8px] py-2.5 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${
                precipPreference === option.value
                  ? "bg-white text-[#191f28] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                  : "text-[#8b95a1]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* 건강 상태 */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#191f28]">
            건강 상태
          </h2>
          {conditionsDirty && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelConditions}
                className="rounded-full bg-[#f2f4f6] px-4 py-2 text-[13px] font-semibold text-[#4e5968] transition-transform active:scale-[0.95]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSaveConditions}
                disabled={myConditionIds.length === 0}
                className="rounded-full bg-[#3182f6] px-4 py-2 text-[13px] font-semibold text-white transition-transform active:enabled:scale-95 disabled:opacity-40"
              >
                저장
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
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
        className="mt-8 w-full rounded-[14px] bg-white py-4 text-[15px] font-semibold text-[#8b95a1] border border-[#e5e8eb] transition-transform active:scale-[0.98]"
      >
        로그아웃
      </button>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-[#3182f6]" : "bg-[#d1d6db]"
      }`}
    >
      <span
        className={`absolute left-[3px] top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
          on ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ProfileLocationRow({
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
    <div className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#8b95a1]">{label}</p>
          <p className="mt-0.5 truncate text-[16px] font-bold tracking-[-0.01em] text-[#191f28]">
            {value}
          </p>
        </div>
        <button
          type="button"
          aria-label={`${label} 수정`}
          onClick={editing ? onCancel : onEdit}
          className={pillButton}
        >
          {editing ? "취소" : "변경"}
        </button>
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-2.5">
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
            className="w-full rounded-[14px] bg-[#3182f6] py-3.5 text-[15px] font-semibold text-white transition-transform active:enabled:scale-[0.98] active:enabled:bg-[#2272eb] disabled:opacity-40"
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
        "relative flex aspect-square flex-col items-center justify-center gap-2 rounded-[16px] border p-2 text-center transition-all active:scale-[0.96]",
        selected
          ? "border-[#3182f6] bg-[#e8f3ff]"
          : "border-[#e5e8eb] bg-white",
      ].join(" ")}
    >
      {selected && (
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#3182f6] text-[12px] font-bold leading-none text-white">
          ✓
        </span>
      )}

      <div
        className={[
          "grid h-13 w-13 place-items-center rounded-full transition-all",
          selected ? "bg-white" : "bg-[#f9fafb]",
        ].join(" ")}
      >
        {isNoCondition ? (
          <span className="text-[22px] font-bold leading-none text-[#8b95a1]">0</span>
        ) : (
          <span className={selected ? "" : "opacity-35 grayscale"}>
            <IllnessIcon index={getConditionIconIndex(label)} scale={0.115} />
          </span>
        )}
      </div>
      <span
        className={`text-[13px] font-bold leading-tight tracking-[-0.01em] ${
          selected ? "text-[#3182f6]" : "text-[#8b95a1]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
