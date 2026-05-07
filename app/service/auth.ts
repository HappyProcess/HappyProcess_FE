import {api} from "@/lib/api";

export const login = async (loginId: string, password: string) => {
  const res = await api.post("/auth/login", { loginId, password });
  return res.data;
};

export const signup = async (data: any) => {
  const res = await api.post("/auth/signup", data);
  return res.data;
};