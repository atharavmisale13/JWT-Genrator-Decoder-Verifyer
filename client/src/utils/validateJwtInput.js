const MAX_TOKEN_LENGTH = 16_384;

export function validateJwtInput(token) {
  if (typeof token !== "string" || !token.trim()) {
    return {
      valid: false,
      message: "Please enter a JWT.",
    };
  }

  const normalizedToken = token.trim();

  if (normalizedToken.length > MAX_TOKEN_LENGTH) {
    return {
      valid: false,
      message: "The token exceeds the maximum allowed length.",
    };
  }

  const segments = normalizedToken.split(".");

  if (segments.length !== 3 || segments.some((part) => !part)) {
    return {
      valid: false,
      message:
        "A signed JWT must contain three non-empty segments separated by dots.",
    };
  }

  return {
    valid: true,
    message: "",
    token: normalizedToken,
  };
}