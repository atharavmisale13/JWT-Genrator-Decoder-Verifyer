import { useState } from "react";
import { decodeJwtApi } from "../services/api/decoder.api.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

export function useJwtDecoder() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function decode(token) {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await decodeJwtApi(token);

      setResult(data);

      return data;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to decode the JWT."
      );

      setError(message);

      return null;
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
  }

  return {
    result,
    error,
    isLoading,
    decode,
    reset,
  };
}