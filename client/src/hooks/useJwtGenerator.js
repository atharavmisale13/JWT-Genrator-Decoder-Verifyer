import { useState } from "react";
import { generateJwtApi } from "../services/api/generator.api.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

export function useJwtGenerator() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate(payload) {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await generateJwtApi(payload);

      setResult(data);

      return data;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to generate the JWT."
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
    generate,
    reset,
  };
}