import { api } from "#/lib/api";
import { type Alert, type Family, type FamilySummary, type Location, type LocationType } from "./types";
import { type AlertLocationType } from "./alert";

let familiesCache: FamilySummary[] | null = null;
let familiesRequest: Promise<FamilySummary[]> | null = null;

export const addFamily = async (relativeLoginId: string): Promise<number> => {
  const res = await api.post("/families", { relativeLoginId });
  invalidateFamilies();
  return res.data;
};

export const getFamilies = async (): Promise<FamilySummary[]> => {
  if (familiesCache) return familiesCache;
  if (familiesRequest) return familiesRequest;

  familiesRequest = api.get("/families").then((res) => {
    familiesCache = res.data;
    familiesRequest = null;
    return res.data;
  }).catch((err) => {
    familiesRequest = null;
    throw err;
  });

  return familiesRequest;
};

export const refreshFamilies = async (): Promise<FamilySummary[]> => {
  invalidateFamilies();
  const res = await api.get("/families");
  familiesCache = res.data;
  return res.data;
};

export const invalidateFamilies = () => {
  familiesCache = null;
  familiesRequest = null;
};

export const getFamily = async (familyId: number): Promise<Family> => {
  const res = await api.get(`/families/${familyId}`);
  return res.data;
};

export const updateFamilyConditions = async (familyId: number, conditionIds: number[]) => {
  return api.put(`/families/${familyId}/conditions`, { conditionIds });
};

export const toggleFamilyAlert = async (familyId: number, isAlertEnabled: boolean) => {
  return api.patch(`/families/${familyId}/alert/toggle`, null, {
    params: { isAlertEnabled },
  });
};

export const updateFamilyLocation = async (
  familyId: number,
  data: { locationType: LocationType; areaNo: string }
): Promise<Location> => {
  const res = await api.put(`/families/${familyId}/location`, data);
  return res.data;
};

export const addFamilyAlert = async (
  familyId: number,
  alertTime: string,
  locationType: AlertLocationType
): Promise<Alert> => {
  const res = await api.post(`/families/${familyId}/alerts`, { alertTime, locationType });
  invalidateFamilies();
  return res.data;
};

export const updateFamilyAlert = async (
  familyId: number,
  alertId: number,
  alertTime: string,
  locationType: AlertLocationType
): Promise<Alert> => {
  const res = await api.put(`/families/${familyId}/alerts/${alertId}`, {
    alertTime,
    locationType,
  });
  invalidateFamilies();
  return res.data;
};

export const deleteFamilyAlert = async (familyId: number, alertId: number) => {
  const res = await api.delete(`/families/${familyId}/alerts/${alertId}`);
  invalidateFamilies();
  return res;
};
