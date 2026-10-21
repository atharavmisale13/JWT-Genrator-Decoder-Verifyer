import express from "express";
import request from "supertest";
import { describe, expect, test } from "vitest";

import {
  apiRateLimiter,
  jwtOperationRateLimiter,
} from "./rateLimit.middleware.js";

// ============================================
// TEST APP FACTORY
// ============================================

function createTestApp(limiter) {
  const app = express();

  // Add a predictable request ID for testing.
  app.use((req, res, next) => {
    req.requestId = "security-test-request";
    next();
  });

  // Apply the real rate limiter.
  app.use(limiter);

  app.get("/test", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Request successful",
    });
  });

  return app;
}

// ============================================
// RATE LIMITING SECURITY TESTS
// ============================================

describe("Rate Limiting Security Tests", () => {
  test("general API limiter returns 429 after exceeding 100 requests", async () => {
    const app = createTestApp(apiRateLimiter);

    let response;

    // First 100 requests should succeed.
    for (let i = 0; i < 100; i += 1) {
      response = await request(app).get("/test");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }

    // Request 101 should exceed the limit.
    response = await request(app).get("/test");

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);

    expect(response.body.error.code).toBe(
      "RATE_LIMIT_EXCEEDED"
    );

    expect(response.body.error.message).toBe(
      "Too many requests. Please try again later."
    );

    expect(response.body.requestId).toBe(
      "security-test-request"
    );
  });

  test("JWT operation limiter returns 429 after exceeding 30 requests", async () => {
    const app = createTestApp(jwtOperationRateLimiter);

    let response;

    // First 30 requests should succeed.
    for (let i = 0; i < 30; i += 1) {
      response = await request(app).get("/test");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }

    // Request 31 should exceed the limit.
    response = await request(app).get("/test");

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);

    expect(response.body.error.code).toBe(
      "JWT_RATE_LIMIT_EXCEEDED"
    );

    expect(response.body.error.message).toBe(
      "Too many JWT operations. Please wait before trying again."
    );

    expect(response.body.requestId).toBe(
      "security-test-request"
    );
  });
});