import { describe, expect, test } from "vitest";

import {
  generateJwtSchema,
  decodeJwtSchema,
  verifyJwtSchema,
} from "./jwt.schema.js";

const VALID_KEY =
  "test-only-secret-with-sufficient-length-123456";

const VALID_PAYLOAD = {
  sub: "test-user",
  role: "tester",
};

describe("JWT Schema Validation", () => {
  describe("generateJwtSchema", () => {
    test("accepts a valid HS256 generation request", () => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload: VALID_PAYLOAD,
        key: VALID_KEY,
        expiresIn: "1h",
      });

      expect(result.success).toBe(true);
    });

    test.each(["HS256", "RS256", "ES256", "PS256"])(
      "accepts the supported algorithm %s",
      (algorithm) => {
        const result = generateJwtSchema.safeParse({
          algorithm,
          payload: VALID_PAYLOAD,
          key: VALID_KEY,
        });

        expect(result.success).toBe(true);
      }
    );

    test("rejects an unsupported algorithm", () => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS512",
        payload: VALID_PAYLOAD,
        key: VALID_KEY,
      });

      expect(result.success).toBe(false);
    });

    test.each([
      undefined,
      null,
      [],
      "invalid-payload",
      123,
    ])("rejects an invalid payload", (payload) => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload,
        key: VALID_KEY,
      });

      expect(result.success).toBe(false);
    });

    test("rejects a payload containing more than 100 properties", () => {
      const payload = Object.fromEntries(
        Array.from(
          { length: 101 },
          (_, index) => [`claim${index}`, index]
        )
      );

      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload,
        key: VALID_KEY,
      });

      expect(result.success).toBe(false);
    });

    test.each(["", "   "])(
      "rejects an empty signing key",
      (key) => {
        const result = generateJwtSchema.safeParse({
          algorithm: "HS256",
          payload: VALID_PAYLOAD,
          key,
        });

        expect(result.success).toBe(false);
      }
    );

    test("rejects a key exceeding 10,000 characters", () => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload: VALID_PAYLOAD,
        key: "k".repeat(10_001),
      });

      expect(result.success).toBe(false);
    });

    test("accepts an omitted expiresIn value", () => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload: VALID_PAYLOAD,
        key: VALID_KEY,
      });

      expect(result.success).toBe(true);
    });

    test("rejects an empty expiresIn value", () => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload: VALID_PAYLOAD,
        key: VALID_KEY,
        expiresIn: "",
      });

      expect(result.success).toBe(false);
    });

    test("rejects expiresIn longer than 100 characters", () => {
      const result = generateJwtSchema.safeParse({
        algorithm: "HS256",
        payload: VALID_PAYLOAD,
        key: VALID_KEY,
        expiresIn: "1".repeat(101),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("decodeJwtSchema", () => {
    test("accepts a nonempty token", () => {
      const result = decodeJwtSchema.safeParse({
        token: "header.payload.signature",
      });

      expect(result.success).toBe(true);
    });

    test.each([
      undefined,
      null,
      "",
      123,
    ])("rejects an invalid token", (token) => {
      const result = decodeJwtSchema.safeParse({ token });

      expect(result.success).toBe(false);
    });

    test("rejects a token exceeding 16,384 characters", () => {
      const result = decodeJwtSchema.safeParse({
        token: "a".repeat(16_385),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("verifyJwtSchema", () => {
    test("accepts a valid verification request", () => {
      const result = verifyJwtSchema.safeParse({
        token: "header.payload.signature",
        algorithm: "HS256",
        key: VALID_KEY,
      });

      expect(result.success).toBe(true);
    });

    test("rejects an unsupported verification algorithm", () => {
      const result = verifyJwtSchema.safeParse({
        token: "header.payload.signature",
        algorithm: "HS512",
        key: VALID_KEY,
      });

      expect(result.success).toBe(false);
    });

    test("rejects a missing verification key", () => {
      const result = verifyJwtSchema.safeParse({
        token: "header.payload.signature",
        algorithm: "HS256",
      });

      expect(result.success).toBe(false);
    });

    test("rejects an oversized verification key", () => {
      const result = verifyJwtSchema.safeParse({
        token: "header.payload.signature",
        algorithm: "HS256",
        key: "k".repeat(10_001),
      });

      expect(result.success).toBe(false);
    });

    test("rejects an oversized verification token", () => {
      const result = verifyJwtSchema.safeParse({
        token: "a".repeat(16_385),
        algorithm: "HS256",
        key: VALID_KEY,
      });

      expect(result.success).toBe(false);
    });
  });
});