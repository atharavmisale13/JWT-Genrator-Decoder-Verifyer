import { apiClient } from "./client.js";

export async function decodeJwtApi(token) {
  const response = await apiClient.post("/jwt/decode", {
    token,
  });

  return response.data.data;
}