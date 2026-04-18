import { apiClient } from "./client";

export async function singin() {
  const response = await apiClient.post("/signin");
  return response.data;
}