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
  dangerLevel: "위험" | "안전",
  warningMessage: string,
  targetConditionName: Illness
}

export type AlertSetting = {
  isEnabled: boolean;
  alertTime: AlertTimes;
  dustAlert: any;
  humidityAlert: any;
  uvAlert: any;
  tempAlert: any;
}

enum Illness {
  '천식', '고혈압', '안구건조증',
  '햇빛알러지', '꽃가루알러지',
  '비염', '당뇨', '심장질환',
  '피부염/아토피', '관절염',
  '뇌졸중', '어린이', '고령',
}

enum AlertTimes {
  '00:00', '01:00', '02:00', '03:00', '04:00',
  '05:00', '06:00', '07:00', '08:00', '09:00',
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
}