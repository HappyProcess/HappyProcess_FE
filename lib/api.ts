// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 15000, // 서버 행(hang) 시 무한 로딩 방지 — 초과 시 에러로 떨궈 재시도 가능하게
});

// reissue 전용 인스턴스 — 무한루프 방지
const authApi = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 동시에 여러 요청이 401/403을 받아도 reissue는 단 한 번만 — 진행 중인 reissue를 공유한다.
// (만료 토큰으로 요청 수십 개가 터질 때 reissue가 그 수만큼 중복 호출되는 폭주를 방지)
let reissuePromise: Promise<string> | null = null;
// 리다이렉트는 한 번만 — 여러 요청의 catch가 각자 location.href를 때려 깜빡이는 걸 방지
let redirecting = false;

const reissueOnce = (): Promise<string> => {
  if (reissuePromise) return reissuePromise;

  reissuePromise = (async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
    const { data } = await authApi.post("/auth/reissue", { refreshToken });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken as string;
  })().finally(() => {
    reissuePromise = null;
  });

  return reissuePromise;
};

const redirectToLogin = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  if (redirecting || typeof window === "undefined") return;
  const path = window.location.pathname;
  if (!path.startsWith("/login") && !path.startsWith("/register")) {
    redirecting = true;
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const accessToken = await reissueOnce();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);
