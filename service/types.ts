export type Location = {
  locationId: number;
  locationType: "HOME" | "WORK";
  city: string;
  lat: number;
  lon: number;
}

export type Weather = {
  temperature: number;
  humidity: number;
  fineDust: string;
}