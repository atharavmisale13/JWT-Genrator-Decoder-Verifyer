import mongoose from "mongoose";

import { OperationAudit } from "../models/OperationAudit.js";

const ALLOWED_OPERATIONS = ["GENERATE", "DECODE", "VERIFY"];

const ALLOWED_STATUSES = ["SUCCESS", "FAILURE"];

const ALLOWED_ALGORITHMS = ["HS256", "RS256", "ES256", "PS256"];

const ERROR_CODE_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * Records explicitly approved audit metadata.
 *
 * Never store:
 * - JWTs
 * - Signing secrets
 * - Private keys
 * - JWT payloads
 */
export async function recordOperation(details) {
  if (!details || typeof details !== "object") {
    throw new Error("Invalid audit metadata.");
  }

  const {
    requestId,
    operation,
    algorithm,
    status,
    errorCode,
  } = details;

  // Validate request ID.
  if (
    typeof requestId !== "string" ||
    requestId.trim().length === 0 ||
    requestId.length > 100
  ) {
    throw new Error("Invalid audit request ID.");
  }

  // Validate operation.
  if (!ALLOWED_OPERATIONS.includes(operation)) {
    throw new Error("Invalid audit operation.");
  }

  // Validate status.
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error("Invalid audit status.");
  }

  // Validate algorithm.
  if (
    algorithm !== undefined &&
    algorithm !== null &&
    !ALLOWED_ALGORITHMS.includes(algorithm)
  ) {
    throw new Error("Invalid audit algorithm.");
  }

  // Validate error code.
  if (
    errorCode !== undefined &&
    errorCode !== null &&
    (
      typeof errorCode !== "string" ||
      !ERROR_CODE_PATTERN.test(errorCode)
    )
  ) {
    throw new Error("Invalid audit error code.");
  }

  // Avoid attempting database writes while disconnected.
  if (mongoose.connection.readyState !== 1) {
    const error = new Error("Audit database is unavailable.");
    error.code = "AUDIT_DATABASE_UNAVAILABLE";

    throw error;
  }

  // Construct an allowlisted record.
  const auditRecord = {
    requestId,
    operation,
    status,
    ...(algorithm ? { algorithm } : {}),
    ...(errorCode ? { errorCode } : {}),
  };

  try {
    return await OperationAudit.create(auditRecord);
  } catch (cause) {
    // Preserve a safe diagnostic category without logging raw DB errors.
    const error = new Error("Audit record persistence failed.");

    error.code =
      typeof cause?.code === "string" ||
      typeof cause?.code === "number"
        ? cause.code
        : "AUDIT_PERSISTENCE_FAILED";

    error.name = cause?.name || "AuditPersistenceError";

    throw error;
  }
}