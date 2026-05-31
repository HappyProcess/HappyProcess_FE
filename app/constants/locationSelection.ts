import { type Location } from "#/service/types";

export type SelectedLocationType = "HOME" | "WORK";

export const LOCATION_TYPE_STORAGE_KEY = "selectedLocationType";
export const LOCATION_TYPE_CHANGED_EVENT = "selectedLocationTypeChanged";

export const getLocationTitle = (location?: Location) =>
  location ? `${location.sido} ${location.sigungu} ${location.dong}` : "지역 미설정";

export const getStoredLocationType = (): SelectedLocationType => {
  if (typeof window === "undefined") return "HOME";
  return localStorage.getItem(LOCATION_TYPE_STORAGE_KEY) === "WORK" ? "WORK" : "HOME";
};

export const saveSelectedLocationType = (locationType: SelectedLocationType) => {
  localStorage.setItem(LOCATION_TYPE_STORAGE_KEY, locationType);
  window.dispatchEvent(
    new CustomEvent(LOCATION_TYPE_CHANGED_EVENT, {
      detail: { locationType },
    })
  );
};
