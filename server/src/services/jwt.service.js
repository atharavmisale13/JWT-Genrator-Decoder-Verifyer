import { ApiError } from "../utils/ApiError.js";

import {
  decodeJwt as joseDecodeJwt,
  decodeProtectedHeader,
} from "jose";

import {
  signJwt,
  verifyJwt as verifyJwtSignature,
} from "../crypto/providers/jwt.provider.js";

const SUPPORTED_ALGORITHMS = [
  "HS256",
  "RS256",
  "ES256",
  "PS256",
];

const MIN_HS256_SECRET_BYTES = 32;

/**
 * Generate a signed JWT.
 */
export async function generateJwt({
  algorithm,
  payload,
  key,
  expiresIn = "1h",
}) {
  // Validate the selected algorithm.
  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    throw new ApiError(
      "Unsupported signing algorithm.",
      400,
      "VALIDATION_ERROR"
    );
  }

  // Validate the payload.
  if (
    payload === undefined ||
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      "A valid JWT payload object is required.",
      400,
      "VALIDATION_ERROR"
    );
  }

  // Validate the signing key.
  if (typeof key !== "string" || key.trim().length === 0) {
    throw new ApiError(
      "Signing key is required and cannot be empty.",
      400,
      "VALIDATION_ERROR"
    );
  }

  // Enforce the minimum HS256 secret length.
  if (algorithm === "HS256") {
    const secretBytes = Buffer.byteLength(key, "utf8");

    if (secretBytes < MIN_HS256_SECRET_BYTES) {
      throw new ApiError(
        "HS256 requires a secret of at least 32 bytes.",
        400,
        "WEAK_SIGNING_KEY"
      );
    }
  }

  try {
    const token = await signJwt({
      algorithm,
      payload,
      key,
      expiresIn,
    });

    return {
      token,
      algorithm,
      expiresIn,
      tokenType: "Bearer",
    };
  } catch {
    throw new ApiError(
      "JWT generation failed. Check the signing key and request data.",
      400,
      "JWT_GENERATION_FAILED"
    );
  }
}

/**
 * Decode a JWT without verifying its signature.
 *
 * Decoding is not proof that a token is authentic.
 */
export function decodeToken(token) {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new ApiError(
      "A JWT token is required.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const normalizedToken = token.trim();
  const segments = normalizedToken.split(".");

  if (
    segments.length !== 3 ||
    segments.some((segment) => segment.length === 0)
  ) {
    throw new ApiError(
      "The token must have three non-empty JWT segments.",
      400,
      "MALFORMED_JWT"
    );
  }

  try {
    const header = decodeProtectedHeader(normalizedToken);
    const payload = joseDecodeJwt(normalizedToken);

    return {
      header,
      payload,
      algorithm: header.alg ?? null,
      tokenType: header.typ ?? null,
      verified: false,
      message:
        "Token decoded successfully, but its signature has not been verified.",
    };
  } catch {
    throw new ApiError(
      "Unable to decode the JWT. Check that the token is correctly formatted.",
      400,
      "MALFORMED_JWT"
    );
  }
}

/**
 * Verify a JWT signature and return its claims.
 */
export async function verifyToken({
  token,
  algorithm,
  key,
}) {
  // Validate request inputs before attempting verification.
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new ApiError(
      "A JWT token is required.",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (typeof key !== "string" || key.trim().length === 0) {
    throw new ApiError(
      "A verification key is required.",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    throw new ApiError(
      "Unsupported verification algorithm.",
      400,
      "VALIDATION_ERROR"
    );
  }

  try {
    const result = await verifyJwtSignature({
      token: token.trim(),
      algorithm,
      key,
    });

    const payload = result.payload;

    return {
      verified: true,
      algorithm: result.header.alg,
      header: result.header,
      payload,
      claims: {
        issuer: payload.iss ?? null,
        subject: payload.sub ?? null,
        audience: payload.aud ?? null,
        issuedAt: payload.iat ?? null,
        expiresAt: payload.exp ?? null,
        notBefore: payload.nbf ?? null,
      },
    };
  } catch {
    throw new ApiError(
      "JWT verification failed. Check the token, algorithm, and verification key.",
      401,
      "JWT_VERIFICATION_FAILED"
    );
  }
}