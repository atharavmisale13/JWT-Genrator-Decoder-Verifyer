import request from "supertest";
import { describe, expect, test } from "vitest";

import { signJwt } from "./crypto/providers/jwt.provider.js";
import { app } from "./app.js";

// ============================================
// 1. HEALTH API TESTS
// ============================================

describe("Health API", () => {
  test("returns healthy status, database state, and request ID", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.service).toBe("jwt-generator-api");
    expect(response.body.data.status).toBe("healthy");

    // Database can be disconnected during isolated tests.
    expect(["connected", "disconnected"]).toContain(
      response.body.data.database
    );

    expect(response.headers["x-request-id"]).toBeDefined();
  });
});

// ============================================
// 2. JWT API VALIDATION TESTS
// ============================================

describe("JWT API validation", () => {
  test("rejects an unsupported algorithm", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS512",
        payload: {
          sub: "test-user",
        },
        key: "test-only-secret-with-sufficient-length-123456",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a missing payload", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        key: "test-only-secret-with-sufficient-length-123456",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  // NEW TEST 1: Whitespace-only signing key
  test("rejects a whitespace-only signing key", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        payload: {
          sub: "test-user",
        },
        key: "   ",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.requestId).toBeDefined();
  });

  // NEW TEST 2: Payload with more than 100 properties
  test("rejects a payload containing more than 100 properties", async () => {
    const payload = Object.fromEntries(
      Array.from({ length: 101 }, (_, index) => [
        `claim${index}`,
        `value${index}`,
      ])
    );

    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        payload,
        key: "test-only-secret-with-sufficient-length-123456",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  // NEW TEST 3: Token exceeding the maximum length
  test("rejects a token exceeding 16,384 characters", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .send({
        token: "a".repeat(16_385),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  // NEW TEST 4: Verification key exceeding the maximum length
  test("rejects a verification key exceeding 10,000 characters", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/verify")
      .send({
        token: "header.payload.signature",
        algorithm: "HS256",
        key: "k".repeat(10_001),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects an empty token", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .send({
        token: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a missing verification key", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/verify")
      .send({
        token: "header.payload.signature",
        algorithm: "HS256",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ============================================
// 3. JWT GENERATION INTEGRATION TESTS
// ============================================

describe("JWT Generation API", () => {
  const testSecret =
    "test-only-secret-with-sufficient-length-123456";

  test("generates a valid HS256 JWT", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        payload: {
          sub: "test-user",
          role: "tester",
        },
        key: testSecret,
        expiresIn: "1h",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.data.algorithm).toBe("HS256");
    expect(response.body.data.tokenType).toBe("Bearer");
    expect(response.body.data.expiresIn).toBe("1h");

    expect(response.body.data.token).toBeDefined();
    expect(typeof response.body.data.token).toBe("string");

    // A compact JWT contains three segments.
    expect(response.body.data.token.split(".")).toHaveLength(3);

    // The signing secret must never be returned.
    expect(response.body.data.key).toBeUndefined();

    expect(JSON.stringify(response.body)).not.toContain(testSecret);
  });

  test("rejects a weak HS256 signing secret", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        payload: {
          sub: "test-user",
        },
        key: "short-secret",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("WEAK_SIGNING_KEY");
  });

  test("rejects an empty signing key", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        payload: {
          sub: "test-user",
        },
        key: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ============================================
// 4. JWT DECODER INTEGRATION TESTS
// ============================================

describe("JWT Decoder API", () => {
  const testSecret =
    "test-only-secret-with-sufficient-length-123456";

  test("decodes an HS256 JWT without claiming verification", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: {
        sub: "test-user",
        role: "developer",
      },
      key: testSecret,
    });

    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .send({ token });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.header.alg).toBe("HS256");
    expect(response.body.data.algorithm).toBe("HS256");

    expect(response.body.data.payload.sub).toBe("test-user");
    expect(response.body.data.payload.role).toBe("developer");

    // Decoding alone does not verify a JWT signature.
    expect(response.body.data.verified).toBe(false);

    expect(response.body.data.message).toContain(
      "signature has not been verified"
    );
  });

  test("rejects a malformed JWT", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .send({
        token: "this-is-not-a-jwt",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("MALFORMED_JWT");
  });

  test("rejects a JWT with an invalid encoded payload", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .send({
        token: "eyJhbGciOiJIUzI1NiJ9.@@@.signature",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("MALFORMED_JWT");
  });
});

// ============================================
// 5. JWT VERIFICATION INTEGRATION TESTS
// ============================================

describe("JWT Verification API", () => {
  const testSecret =
    "test-only-secret-with-sufficient-length-123456";

  test("successfully verifies a valid HS256 JWT", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: {
        sub: "test-user",
        role: "developer",
        iss: "jwt-generator-test",
      },
      key: testSecret,
    });

    const response = await request(app)
      .post("/api/v1/jwt/verify")
      .send({
        token,
        algorithm: "HS256",
        key: testSecret,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.verified).toBe(true);
    expect(response.body.data.algorithm).toBe("HS256");

    expect(response.body.data.payload.sub).toBe("test-user");
    expect(response.body.data.payload.role).toBe("developer");

    expect(response.body.data.claims.issuer).toBe(
      "jwt-generator-test"
    );

    expect(response.body.data.claims.subject).toBe("test-user");
    expect(response.body.data.claims.expiresAt).toBeDefined();
  });

  test("rejects a JWT signed with the wrong secret", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: {
        sub: "test-user",
      },
      key: testSecret,
    });

    const response = await request(app)
      .post("/api/v1/jwt/verify")
      .send({
        token,
        algorithm: "HS256",
        key: "incorrect-test-secret-with-sufficient-length",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);

    expect(response.body.error.code).toBe(
      "JWT_VERIFICATION_FAILED"
    );
  });

  test("rejects an algorithm mismatch", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: {
        sub: "test-user",
      },
      key: testSecret,
    });

    const response = await request(app)
      .post("/api/v1/jwt/verify")
      .send({
        token,
        algorithm: "RS256",
        key: testSecret,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);

    expect(response.body.error.code).toBe(
      "JWT_VERIFICATION_FAILED"
    );
  });

  test("rejects a malformed JWT", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/verify")
      .send({
        token: "not-a-valid-jwt",
        algorithm: "HS256",
        key: testSecret,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);

    expect(response.body.error.code).toBe(
      "JWT_VERIFICATION_FAILED"
    );
  });
});

// ============================================
// 6. CENTRALIZED ERROR HANDLING TESTS
// ============================================

describe("Centralized Error Handling", () => {
  test("returns a standardized 404 response for an unknown route", async () => {
    const response = await request(app).get(
      "/api/v1/unknown-endpoint"
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);

    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.body.requestId).toBeDefined();
  });

  test("returns a standardized error for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .set("Content-Type", "application/json")
      .send('{"token":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("MALFORMED_JSON");
    expect(response.body.requestId).toBeDefined();
  });

  test("rejects oversized JSON request bodies", async () => {
    const oversizedPayload = JSON.stringify({
      token: "a".repeat(110 * 1024),
    });

    const response = await request(app)
      .post("/api/v1/jwt/decode")
      .set("Content-Type", "application/json")
      .send(oversizedPayload);

    expect(response.status).toBe(413);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
    expect(response.body.requestId).toBeDefined();

    const responseText = JSON.stringify(response.body);

    expect(responseText).not.toContain("stack");
  });

  test("does not expose sensitive information in an API response", async () => {
    const testSecret = "short-secret";

    const response = await request(app)
      .post("/api/v1/jwt/generate")
      .send({
        algorithm: "HS256",
        payload: {
          sub: "test-user",
        },
        key: testSecret,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("WEAK_SIGNING_KEY");
    expect(response.body.requestId).toBeDefined();

    const responseText = JSON.stringify(response.body);

    expect(responseText).not.toContain(testSecret);
    expect(responseText).not.toContain("stack");
    expect(responseText).not.toContain("Error:");
  });
});