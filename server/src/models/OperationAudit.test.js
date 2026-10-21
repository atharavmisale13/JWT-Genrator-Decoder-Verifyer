import { describe, expect, test } from "vitest";

import { OperationAudit } from "./OperationAudit.js";

describe("OperationAudit model", () => {
  test("accepts valid operation metadata", async () => {
    const audit = new OperationAudit({
      requestId: "test-request-123",
      operation: "GENERATE",
      algorithm: "HS256",
      status: "SUCCESS",
    });

    await expect(audit.validate()).resolves.toBeUndefined();
  });

  test("rejects unsupported operations", async () => {
    const audit = new OperationAudit({
      requestId: "test-request-123",
      operation: "DELETE_EVERYTHING",
      algorithm: "HS256",
      status: "SUCCESS",
    });

    await expect(audit.validate()).rejects.toThrow();
  });

  test("rejects unsupported algorithms", async () => {
    const audit = new OperationAudit({
      requestId: "test-request-123",
      operation: "GENERATE",
      algorithm: "HS512",
      status: "SUCCESS",
    });

    await expect(audit.validate()).rejects.toThrow();
  });

  test("rejects missing request IDs", async () => {
    const audit = new OperationAudit({
      operation: "GENERATE",
      algorithm: "HS256",
      status: "SUCCESS",
    });

    await expect(audit.validate()).rejects.toThrow();
  });

  test("does not allow unknown schema fields", () => {
  expect(() => {
    new OperationAudit({
      requestId: "test-request-123",
      operation: "GENERATE",
      algorithm: "HS256",
      status: "SUCCESS",
      privateKey: "should-never-be-stored",
    });
  }).toThrow(/privateKey/);
});
});