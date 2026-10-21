import { useState } from "react";
import { verifyJwtApi } from "../services/api/verifier.api.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

export function useJwtVerifier() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function verify(payload) {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await verifyJwtApi(payload);

      setResult(data);

      return data;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to verify the JWT."
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
    verify,
    reset,
  };
}