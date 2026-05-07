'use client'
import { RegionSelect, MultiSelect, Tooltip } from "@/components";
import { getYearOptions, healthOptions, commuteOptions } from "./Options";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "./schema";
import { useRouter } from "next/navigation";
import React from "react";
import { signup } from "@/service/auth";
import toast from "react-hot-toast";
import { parseError } from "@/lib/parseError";

const LOCATION_TYPES = ["HOME", "WORK"] as const;
type LocationType = typeof LOCATION_TYPES[number];
const LOCATION_LABEL: Record<LocationType, string> = {
  HOME: "거주지역",
  WORK: "직장/학교",
};

type FormValues = {
  loginId: string;
  password: string;
  name: string;
  birth: string;
  commuteTime: string | null;
  locations: {
    locationType: LocationType;
    city: string;
  }[];
  conditionIds: number[];
};

const inputClass = "w-full border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] leading-[1.47] tracking-[-0.374px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
const selectClass = "border border-[rgba(0,0,0,0.08)] rounded-full px-5 py-[10px] text-[17px] text-[#1d1d1f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] cursor-pointer"
const labelClass = "text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]"

export default function Register() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      commuteTime: null,
      locations: [],
      conditionIds: [],
    },
  });
  const router = useRouter();

  const onSubmit = async (data: FormValues) => {
    try {
      await signup(data);
      toast.success("회원가입이 완료되었습니다.");
      router.push("/login");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-[18px] border border-[#e0e0e0] px-8 py-10 flex flex-col gap-6">
      <h1 className="text-[28px] font-semibold leading-[1.14] tracking-[-0.374px] text-[#1d1d1f] text-center">
        회원가입
      </h1>

      <form id="registerForm" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit, console.log)}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={labelClass}>
            이름 <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input type="text" id="name" {...register("name")} className={inputClass} />
            {errors.name && <Tooltip content={errors.name.message ?? ""} xAnchor="right" alwaysFocus isOuter />}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="loginId" className={labelClass}>
            아이디 <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input type="text" id="loginId" {...register("loginId")} className={inputClass} />
            {errors.loginId && <Tooltip content={errors.loginId.message ?? ""} xAnchor="right" alwaysFocus isOuter />}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={labelClass}>
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input type="password" id="password" {...register("password")} className={inputClass} />
            {errors.password && <Tooltip content={errors.password.message ?? ""} xAnchor="right" alwaysFocus isOuter />}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            출생연도 <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <select {...register("birth")} className={selectClass}>
              <option value="">출생연도 선택</option>
              {getYearOptions().map((item) => (
                <option key={item} value={`${item}-01-01`}>{item}</option>
              ))}
            </select>
            {errors.birth && <Tooltip content={errors.birth.message ?? ""} xAnchor="right" alwaysFocus isOuter />}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            건강상태 <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="conditionIds"
            render={({ field }) => (
              <MultiSelect
                options={healthOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {LOCATION_TYPES.map((type, index) => (
          <React.Fragment key={type}>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                {LOCATION_LABEL[type]} <span className="text-red-500">*</span>
              </label>
              <input type="hidden" value={type} {...register(`locations.${index}.locationType` as const)} />
              <Controller
                control={control}
                name={`locations.${index}.city`}
                render={({ field }) => (
                  <RegionSelect
                    className={selectClass}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </React.Fragment>
        ))}

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>알림시간</label>
          <select {...register("commuteTime")} className={selectClass}>
            <option value="">알림시간 선택</option>
            {commuteOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-[#0066cc] text-white rounded-full py-[11px] text-[17px] leading-none cursor-pointer active:scale-95 transition-transform focus:outline-2 focus:outline-[#0071e3] mt-2"
        >
          회원가입
        </button>
      </form>
    </div>
  );
}
