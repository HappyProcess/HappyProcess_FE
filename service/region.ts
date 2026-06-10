import { api } from "#/lib/api";
import { dedupe } from "#/lib/dedupe";

export const getSido = () =>
  dedupe("regions/sido", () =>
    api.get<string[]>("/regions/sido").then((r) => r.data)
  );

export const getSigungu = (sido: string) =>
  dedupe(`regions/sigungu/${sido}`, () =>
    api.get<string[]>("/regions/sigungu", { params: { sido } }).then((r) => r.data)
  );

export const getDong = (sido: string, sigungu: string) =>
  dedupe(`regions/dong/${sido}/${sigungu}`, () =>
    api
      .get<{ areaNo: string; dong: string }[]>("/regions/dong", { params: { sido, sigungu } })
      .then((r) => r.data)
  );
