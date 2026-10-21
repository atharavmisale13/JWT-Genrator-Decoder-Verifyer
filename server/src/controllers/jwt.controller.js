import {
  generateJwt,
  decodeToken,
  verifyToken,
} from "../services/jwt.service.js";

import { recordOperation } from "../services/audit.service.js";

import { successResponse } from "../utils/response.js";

const SUPPORTED_ALGORITHMS = new Set([
  "HS256",
  "RS256",
  "ES256",
  "PS256",
]);

const SAFE_ERROR_CODE_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * Return a safe error code for audit metadata.
 */
function getSafeErrorCode(error) {
  const code = error?.code;

  if (
    typeof code === "string" &&
    SAFE_ERROR_CODE_PATTERN.test(code)
  ) {
    return code;
  }

  return "OPERATION_FAILED";
}

/**
 * Accept only supported algorithms for audit metadata.
 */
function getSafeAlgorithm(algorithm) {
  return SUPPORTED_ALGORITHMS.has(algorithm)
    ? algorithm
    : undefined;
}

/**
 * Audit logging is best-effort.
 *
 * Audit failures must not change the outcome of the JWT operation
 * or expose sensitive information in logs.
 */
async function safelyRecordOperation(details) {
  try {
    await recordOperation(details);
  } catch (error) {
    const safeErrorCode =
      typeof error?.code === "string" &&
      SAFE_ERROR_CODE_PATTERN.test(error.code)
        ? error.code
        : typeof error?.code === "number"
          ? error.code
          : "AUDIT_PERSISTENCE_FAILED";

    console.warn("Audit operation could not be recorded.", {
      requestId: details.requestId,
      operation: details.operation,
      errorName: error?.name || "UnknownError",
      errorCode: safeErrorCode,
    });
  }
}

/**
 * Generate a signed JWT.
 */
export async function generateJwtController(req, res, next) {
  const requestId = req.requestId;
  const requestedAlgorithm = getSafeAlgorithm(req.body?.algorithm);

  try {
    const result = await generateJwt(req.body);

    await safelyRecordOperation({
      requestId,
      operation: "GENERATE",
      algorithm: getSafeAlgorithm(result.algorithm),
      status: "SUCCESS",
    });

    return successResponse(res, result, 201);
  } catch (error) {
    await safelyRecordOperation({
      requestId,
      operation: "GENERATE",
      ...(requestedAlgorithm
        ? { algorithm: requestedAlgorithm }
        : {}),
      status: "FAILURE",
      errorCode: getSafeErrorCode(error),
    });

    return next(error);
  }
}

/**
 * Decode a JWT without verifying its signature.
 */
export async function decodeJwtController(req, res, next) {
  const requestId = req.requestId;

  try {
    const result = await decodeToken(req.body?.token);

    await safelyRecordOperation({
      requestId,
      operation: "DECODE",
      ...(getSafeAlgorithm(result.algorithm)
        ? { algorithm: getSafeAlgorithm(result.algorithm) }
        : {}),
      status: "SUCCESS",
    });

    return successResponse(res, result);
  } catch (error) {
    await safelyRecordOperation({
      requestId,
      operation: "DECODE",
      status: "FAILURE",
      errorCode: getSafeErrorCode(error),
    });

    return next(error);
  }
}

/**
 * Verify a JWT's cryptographic signature.
 */
export async function verifyJwtController(req, res, next) {
  const requestId = req.requestId;
  const requestedAlgorithm = getSafeAlgorithm(req.body?.algorithm);

  try {
    const result = await verifyToken(req.body);

    await safelyRecordOperation({
      requestId,
      operation: "VERIFY",
      algorithm: getSafeAlgorithm(result.algorithm),
      status: "SUCCESS",
    });

    return successResponse(res, result);
  } catch (error) {
    await safelyRecordOperation({
      requestId,
      operation: "VERIFY",
      ...(requestedAlgorithm
        ? { algorithm: requestedAlgorithm }
        : {}),
      status: "FAILURE",
      errorCode: getSafeErrorCode(error),
    });

    return next(error);
  }
}