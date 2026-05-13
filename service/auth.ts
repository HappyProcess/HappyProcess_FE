import {api} from "#/lib/api";

export const login = async (loginId: string, password: string) => {
  const res = await api.post("/auth/login", { loginId, password });
  return res.data;
};

export const signup = async (data: any) => {
  const res = await api.post("/auth/signup", data);
  return res.data;
};

export const logout = async (refreshToken: string) => {
  const res = await api.post("/auth/logout", { refreshToken });
  return res;
};

export const reissue = async (refreshToken: string) => {
  const res = await api.post("/auth/reissue", { refreshToken });
  return res.data;
}