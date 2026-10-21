import {
  SignJWT,
  jwtVerify,
  importPKCS8,
  importSPKI,
} from "jose";

const SUPPORTED_ALGORITHMS = Object.freeze([
  "HS256",
  "RS256",
  "ES256",
  "PS256",
]);

const ASYMMETRIC_ALGORITHMS = new Set([
  "RS256",
  "ES256",
  "PS256",
]);

function assertSupportedAlgorithm(algorithm) {
  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    throw new Error("Unsupported JWT algorithm.");
  }
}

function assertNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
}

async function importSigningKey(algorithm, key) {
  assertNonEmptyString(key, "Signing key");

  if (algorithm === "HS256") {
    return new TextEncoder().encode(key);
  }

  if (!ASYMMETRIC_ALGORITHMS.has(algorithm)) {
    throw new Error("Unsupported signing algorithm.");
  }

  return importPKCS8(key, algorithm);
}

async function importVerificationKey(algorithm, key) {
  assertNonEmptyString(key, "Verification key");

  if (algorithm === "HS256") {
    return new TextEncoder().encode(key);
  }

  if (!ASYMMETRIC_ALGORITHMS.has(algorithm)) {
    throw new Error("Unsupported verification algorithm.");
  }

  return importSPKI(key, algorithm);
}

export async function signJwt({
  algorithm,
  payload,
  key,
  expiresIn = "1h",
}) {
  assertSupportedAlgorithm(algorithm);

  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error("JWT payload must be an object.");
  }

  const signingKey = await importSigningKey(algorithm, key);

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: algorithm,
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(signingKey);
}

export async function verifyJwt({
  token,
  algorithm,
  key,
}) {
  assertSupportedAlgorithm(algorithm);
  assertNonEmptyString(token, "JWT token");

  const verificationKey = await importVerificationKey(
    algorithm,
    key
  );

  const { payload, protectedHeader } = await jwtVerify(
    token,
    verificationKey,
    {
      algorithms: [algorithm],
    }
  );

  return {
    header: protectedHeader,
    payload,
  };
}

export { SUPPORTED_ALGORITHMS };