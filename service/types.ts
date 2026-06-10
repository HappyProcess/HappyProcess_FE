export type Location = {
  locationId: number;
  locationType: "HOME" | "WORK";
  areaNo: string;
  sido: string;
  sigungu: string;
  dong: string;
}

// 강수 비선호. 질병 없는 사용자의 날씨 점수(강수 불편도)에만 반영.
export type PrecipPreference = "NONE" | "RAIN" | "SNOW";

export type Profile = {
  loginId: string;
  name: string;
  birth: string;
  commuteTime: string;
  phoneNumber?: string | null; // 하이픈 없는 숫자. 미등록 시 null
  smsEnabled?: boolean; // 위험 알림 문자 수신 동의. PR #46 배포 전엔 응답에 없을 수 있음
  precipPreference?: PrecipPreference; // 배포 전 응답에 없을 수 있어 방어. 기본 NONE
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
  weatherScore: number; // 0~100, 낮을수록 나쁜 날씨. 모든 질환에 채워짐
  factorGuides: RiskFactorGuide[]; // 위험 요인 없으면 빈 배열
}

export type RiskStatus = {
  isRisk: boolean;
  risk?: boolean;
  regionName?: string;
  riskDetails?: RiskDetail[];
}

// 커뮤니티 ----------------------------------------------------------------

// Spring Page<T> 응답 구조 (목록/검색/마이페이지 공통)
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 현재 페이지(0부터)
  size: number;
};

export type PostListItem = {
  postId: number;
  title: string;
  writerName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  hasImage: boolean;
  categories: string[]; // 질환 태그 이름들
};

export type CommentResponse = {
  commentId: number;
  writerName: string;
  content: string;
  createdAt: string;
};

export type PostDetail = {
  postId: number;
  title: string;
  content: string;
  writerName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedByMe: boolean; // 서버 JSON 키는 likedByMe (boolean 필드 Jackson 직렬화)
  categories: string[];
  imageUrls: string[]; // Supabase public URL — <img src> 그대로 사용
  comments: CommentResponse[];
};

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

// 증상 일기 ----------------------------------------------------------------

export type DiarySymptom = {
  conditionId: number;
  conditionName: string;
  intensity: number; // 1~5
};

// 작성 시점 날씨 스냅샷. 위치(집/직장)별로 한 건씩. 값이 없으면 각 필드 null
export type DiaryWeatherSnapshot = {
  locationType: "HOME" | "WORK";
  regionName: string | null;
  temperature: string | null;
  humidity: string | null;
  weatherCondition: string | null;
  pm10Value: string | null;
  pm10Grade: string | null;
  pm25Value: string | null;
  pm25Grade: string | null;
  pollenRiskLevel: string | null;
  uvRiskLevel: string | null;
};

export type DiaryResponse = {
  diaryId: number;
  entryDate: string; // "YYYY-MM-DD"
  memo: string | null;
  symptoms: DiarySymptom[];
  weathers: DiaryWeatherSnapshot[]; // 집(HOME)/직장(WORK) 위치별 날씨
};

// 주간 리포트 (Gemini 생성, 구조화 JSON)
export type WeeklyReportPattern = {
  weather: string; // 어떤 날씨/환경일 때
  symptom: string; // 어떤 증상이
  observation: string; // 어떻게 나타났는지
};

export type WeeklyReportSolution = {
  target: string; // 어떤 증상/상황에
  action: string; // 무슨 조치를
};

export type WeeklyReportResponse = {
  reportId: number;
  weekStartDate: string; // "YYYY-MM-DD" (월요일)
  weekEndDate: string;
  createdAt: string;
  summary: string; // 한 주 요약 한두 문장
  patterns: WeeklyReportPattern[]; // 데이터 부족 시 빈 배열
  solutions: WeeklyReportSolution[];
};
