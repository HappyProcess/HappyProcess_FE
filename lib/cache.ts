import { getMyConditions, getMyLocations, getMyInformation, getAllConditions } from "#/service/member";
import { getSido } from "#/service/region";
import { type Condition, type Location, type Profile } from "#/service/types";

export async function getCachedConditions(): Promise<Condition[]> {
  const stored = localStorage.getItem("conditions");
  if (stored) return JSON.parse(stored) as Condition[];
  const data = await getMyConditions();
  localStorage.setItem("conditions", JSON.stringify(data));
  return data;
}

export async function getCachedLocations(): Promise<Location[]> {
  const stored = localStorage.getItem("locations");
  if (stored) return JSON.parse(stored) as Location[];
  const data = await getMyLocations();
  localStorage.setItem("locations", JSON.stringify(data));
  return data;
}

export function invalidateConditions() {
  localStorage.removeItem("conditions");
}

export function invalidateLocations() {
  localStorage.removeItem("locations");
}

export async function getCachedProfile(): Promise<Profile> {
  const stored = localStorage.getItem("profile");
  if (stored) return JSON.parse(stored) as Profile;
  const data = await getMyInformation();
  localStorage.setItem("profile", JSON.stringify(data));
  return data;
}

export function invalidateProfile() {
  localStorage.removeItem("profile");
}

export async function getCachedAllConditions(): Promise<Condition[]> {
  const stored = localStorage.getItem("allConditions");
  if (stored) return JSON.parse(stored) as Condition[];
  const data = await getAllConditions();
  localStorage.setItem("allConditions", JSON.stringify(data));
  return data;
}

export async function getCachedSido(): Promise<string[]> {
  const stored = localStorage.getItem("sido");
  if (stored) return JSON.parse(stored) as string[];
  const data = await getSido();
  localStorage.setItem("sido", JSON.stringify(data));
  return data;
}

export function invalidateAll() {
  localStorage.removeItem("conditions");
  localStorage.removeItem("locations");
  localStorage.removeItem("profile");
}
