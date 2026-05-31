export type Location = {
  locationId: number;
  locationType: "HOME" | "WORK";
  areaNo: string;
  sido: string;
  sigungu: string;
  dong: string;
}

export type Profile = {
  loginId: string;
  name: string;
  birth: string;
  commuteTime: string;
}

export type Condition = {
  conditionId: number;
  conditionName: string;
}

// 알림 설정 (매일 N시 알림)
export type Alert = {
  alertId: number;
  alertTime: string; // "HH:mm"
  isEnable: boolean;
  locationType: "HOME" | "WORK" | null;
}

// 알림 발송 기록 (알림함)
export type NotificationHistory = {
  historyId: number;
  diseaseNames: string; // 쉼표 구분 문자열
  factorNames: string | null; // 쉼표 구분 문자열. 과거 알림은 null 가능
  isRead: boolean;
  createdAt: string; // 서버 포맷 문자열 "MM월 dd일 HH:mm" — Date 파싱 금지, 그대로 표시
  locationType: "HOME" | "WORK" | null;
  relativeName: string | null;
}

export type HourlyForecast = {
  time: string;
  temperature: string;
  condition: string;
  humidity: string;
}

export type Weather = {
  regionName: string;
  temperature: string;
  humidity: string;
  weatherCondition: string;
  pm10Value: string;
  pm10Grade: string;
  pm25Value: string;
  pm25Grade: string;
  pollenRiskLevel: string;
  uvRiskLevel: string;
  hourlyForecasts: HourlyForecast[];
}

export type LocationType = "HOME" | "WORK";

export type RiskFactorGuide = {
  factorName: string;
  guide: string;
}

export type RiskDetail = {
  diseaseId: number;
  diseaseName: string;
  factorGuides: RiskFactorGuide[];
}

export type RiskStatus = {
  isRisk: boolean;
  risk?: boolean;
  regionName?: string;
  riskDetails?: RiskDetail[];
}

export type FamilySummary = {
  familyId: number;
  name: string;
  healthConditionNames: string[];
  alertTimes: string[];
}

export type Family = {
  familyId: number;
  relativeId: number;
  name: string;
  age: number;
  alertEnabled: boolean;
  healthConditionNames: string[];
  locations: Location[];
  alerts: Alert[];
}
