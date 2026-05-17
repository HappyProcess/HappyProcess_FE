import { api } from "#/lib/api";
import { type Location } from "./types"

export const getMyInformation = async () => {
  const res = await api.get("/members/me");
  return res.data;
};

export const modifyMyInformation = async (data: any) => {
  const res = await api.patch("/members/me", data);
  return res;
};

export const deleteAccount = async (data: any) => {
  const res = await api.delete("/members/me", data);
  return res;
};

export const getMyLocations = async(): Promise<Location[]> => {
  const res = await api.get("/members/me/locations");
  return res.data;
};

export const modifyMyLocations = async (): Promise<Location[]> => {
  const res = await api.post("/members/me/locations");
  return res.data;
};

export const deleteMyLocations = async (): Promise<Location[]> => {
  const res = await api.delete("/members/me/locations");
  return res.data;
};