import { apiClient } from "./client.js";

export async function generateJwtApi(payload) {
  const response = await apiClient.post("/jwt/generate", payload);

  return response.data.data;
}