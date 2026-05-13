import { isAxiosError } from "axios";

export function parseError(err: unknown): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? "오류가 발생했습니다.";
  }
  return "오류가 발생했습니다.";
}
