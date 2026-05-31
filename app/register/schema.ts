import { z } from "zod";

export const registerSchema = z.object({
  loginId: z
    .string()
    .regex(/^[a-zA-Z0-9]{4,20}$/, "아이디 형식 오류"),

  password: z.string().min(1),

  name: z.string().min(2).max(10),

  birth: z.string(),

  locations: z.array(
    z.object({
      locationType: z.enum(["HOME", "WORK"]),
      areaNo: z.string().min(1),
    })
  ).min(1),

  conditionIds: z.array(z.number()).min(1),
});
