// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://34.50.23.177:8080/api/v1",
});