import { api } from "#/lib/api";
import { Weather } from "./types";

export const getWeather = async (lat: number, lon: number): Promise<Weather> => {
  const res = await api.get("weather");
  return res.data;
};