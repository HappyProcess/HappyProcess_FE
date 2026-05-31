import { api } from "#/lib/api";

export const getSido = () =>
  api.get<string[]>("/regions/sido").then((r) => r.data);

export const getSigungu = (sido: string) =>
  api.get<string[]>("/regions/sigungu", { params: { sido } }).then((r) => r.data);

export const getDong = (sido: string, sigungu: string) =>
  api
    .get<{ areaNo: string; dong: string }[]>("/regions/dong", { params: { sido, sigungu } })
    .then((r) => r.data);
