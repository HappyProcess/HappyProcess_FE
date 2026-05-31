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

