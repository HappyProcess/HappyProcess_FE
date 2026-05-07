'use client'
import { RegionSelect, MultiSelect, Tooltip } from "@/components";
import { getYearOptions, healthOptions, commuteOptions } from "./Options";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "./schema";
import { useRouter } from "next/navigation";
import React from "react";
import { signup } from "@/service/auth";

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

  const LOCATION_TYPES = ["HOME", "WORK"] as const;

  const onSubmit = async (data: FormValues) => {
    console.log("회원가입 데이터:", data);
    try {
      const res = await signup(data);
      console.log("회원가입 성공", res);

      alert("회원가입이 완료되었습니다.");
      router.push("/login");
      // 👉 여기서 페이지 이동 or 로그인 처리
    } catch (err) {
      console.log("회원가입 실패", err);
    }
  };

  return (
    <>
      <header className="border-b-2 px-4 py-2">
        <h1 className="text-2xl font-bold">회원가입 ※</h1>
      </header>
      
      <form id="registerForm" className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit, console.log)}
      >
        <div className="grid grid-cols-[max-content_1fr] items-center px-4 py-2 my-12 gap-x-3 gap-y-4">
          <label htmlFor="name" className="text-sm font-semibold">
            이름<span className="text-red-500">*</span>:
          </label>
          <div className="relative group">
            <input
            type="text" id="name"
            {...register("name")}
            className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {errors.name && <Tooltip content={errors.name.message ?? ""} xAnchor="right" alwaysFocus isOuter/>}
          </div>

          <label htmlFor="id" className="text-sm font-semibold">
            아이디<span className="text-red-500">*</span>:
          </label>
          <div className="relative group">
            <input
            type="id" id="id"
            {...register("loginId")}
            className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.loginId && <Tooltip content={errors.loginId.message ?? ""} xAnchor="right" alwaysFocus isOuter/>}
          </div>

          <label htmlFor="password" className="text-sm font-semibold">
            비밀번호<span className="text-red-500">*</span>:
          </label>
          <div className="relative group">
            <input
            type="password" id="password"
            {...register("password")}
            className="border-2 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <Tooltip content={errors.password.message ?? ""} xAnchor="right" alwaysFocus isOuter/>}
          </div>

          <label className="text-sm font-semibold">
            나이<span className="text-red-500">*</span>:
          </label>
          <div className="relative group">
            <select {...register("birth")}
            className="border w-28 rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">출생연도</option>
              {getYearOptions().map((item) => (
                <option key={item} value={`${item}-01-01`}>
                  {item}
                </option>
              ))}
            </select>
            {errors.birth && <Tooltip content={errors.birth.message ?? ""} xAnchor="right" alwaysFocus isOuter/>}
          </div>

          <label className="text-sm font-semibold">
            건강상태<span className="text-red-500">*</span>:
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
          )}/>
            
          {LOCATION_TYPES.map((type, index) => (<React.Fragment key={type}>
            <label className="text-sm font-semibold">
              {LOCATION_LABEL[type]}<span className="text-red-500">*</span>:
            </label>
            <input
              key={type}
              type="hidden"
              value={type}
              {...register(`locations.${index}.locationType` as const)}
            />
            <Controller
            control={control}
            name={`locations.${index}.city`}
            render={({ field }) => (
              <RegionSelect
              className="border rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={field.value}
              onChange={field.onChange}
              />
            )}/>
          </React.Fragment>))}

          <label className="text-sm font-semibold">
            알림시간:
          </label>
          <select {...register("commuteTime")}
          className="border w-28 rounded-lg px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">알림시간</option>
            {commuteOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        
        <div className="flex flex-col items-center gap-3 border-t-2 py-14">
          <button
          type="submit" form="registerForm"
          className="bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow"
          >
            회원가입
          </button>
        </div>
      </form>
    </>
  );
}
