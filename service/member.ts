import { api } from "#/lib/api";
import { type Location } from "./types"

export const getMe = async () => {
  const res = await api.get("member/me");
  return res.data;
};

export const setMe = async (data: any) => {
  const res = await api.get("member/me", data);
  return res;
};

export const getLocations = async(): Promise<Location[]> => {
  const res = await api.get("member/me/locations");
  return res.data;
};