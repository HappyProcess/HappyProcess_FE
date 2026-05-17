import { api } from "#/lib/api";
import { type Location } from "./types"

export const getMe = async () => {
  const res = await api.get("members/me");
  return res.data;
};

export const patchMe = async (data: any) => {
  const res = await api.patch("members/me", data);
  return res;
};

export const getLocations = async(): Promise<Location[]> => {
  const res = await api.get("members/me/locations");
  return res.data;
};

export const patchLocations = async (): Promise<Location[]> => {
  const res = await api.patch("members/me/locations");
  return res.data;
};

export const deleteLocations = async (): Promise<Location[]> => {
  const res = await api.delete("members/me/locations");
  return res.data;
};