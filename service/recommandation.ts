import { api } from "#/lib/api";

export const getRecommandation = async (areaNo: string): Promise<never[]> => {
  const res = await api.get("/recommendations/actions", { params: { areaNo } });
  return res.data;
};
