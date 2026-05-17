export type Location = {
  locationId: number;
  locationType: "HOME" | "WORK";
  city: string;
  lat: number;
  lon: number;
}

export type Weather = {
  temperature: number;
  humidity: number;
  fineDust: string;
}

export type DangerSummary = {
  dangerLevel: "위험" | "중간" | "안전",
  warningMessage: string,
  targetConditionName: Illness
}

enum Illness {
  '천식',
  '고혈압',
  '안구건조증',
  '햇빛알러지',
  '꽃가루알러지',
  '비염',
  '당뇨',
  '심장질환',
  '피부염/아토피',
  '관절염',
  '뇌졸중',
  '어린이',
  '고령',
}