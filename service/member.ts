import { api } from "#/lib/api";
import { dedupe } from "#/lib/dedupe";
import { type Location, type Profile, type Condition } from "./types";

export const getMyInformation = (): Promise<Profile> =>
  dedupe("members/me", async () => {
    const res = await api.get("/members/me");
    return res.data;
  });

export const modifyMyInformation = async (data: Partial<Omit<Profile, "loginId">>) => {
  const res = await api.patch("/members/me", data);
  return res;
};

export const deleteAccount = async () => {
  const res = await api.delete("/members/me");
  return res;
};

export const getMyLocations = (): Promise<Location[]> =>
  dedupe("members/me/locations", async () => {
    const res = await api.get("/members/me/locations");
    return res.data;
  });

export const addMyLocation = async (data: { locationType: "HOME" | "WORK"; areaNo: string }): Promise<number> => {
  const res = await api.post("/members/me/locations", data);
  return res.data;
};

export const deleteMyLocation = async (locationId: number) => {
  const res = await api.delete("/members/me/locations", { params: { locationId } });
  return res;
};

export const getAllConditions = (): Promise<Condition[]> =>
  dedupe("conditions", async () => {
    const res = await api.get("/conditions");
    return res.data;
  });

export const getMyConditions = (): Promise<Condition[]> =>
  dedupe("members/me/conditions", async () => {
    const res = await api.get("/members/me/conditions");
    return res.data.myConditions;
  });

export const updateMyConditions = async (conditionIds: number[]) => {
  const res = await api.put("/members/me/conditions", { conditionIds });
  return res;
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  await api.post("/auth/logout", { refreshToken });
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  const { invalidateAll } = await import("#/lib/cache");
  invalidateAll();
};
