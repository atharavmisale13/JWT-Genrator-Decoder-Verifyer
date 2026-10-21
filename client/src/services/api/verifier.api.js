import { apiClient } from "./client.js";

export async function verifyJwtApi({ token, algorithm, key }) {
  const response = await apiClient.post("/jwt/verify", {
    token,
    algorithm,
    key,
  });

  return response.data.data;
}