import { rateLimit } from "express-rate-limit";

const isLoadTestMode =
  process.env.LOAD_TEST_MODE === "true" &&
  process.env.NODE_ENV !== "production";

function createRateLimiter({
  limit,
  errorCode,
  message,
}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,

    // Higher limits are permitted only in explicit non-production
    // load-test mode. Production limits remain unchanged.
    limit: isLoadTestMode ? 100000 : limit,

    standardHeaders: true,
    legacyHeaders: false,

    handler(req, res) {
      return res.status(429).json({
        success: false,
        error: {
          code: errorCode,
          message,
        },
        requestId: req.requestId,
      });
    },
  });
}

export const apiRateLimiter = createRateLimiter({
  limit: 100,
  errorCode: "RATE_LIMIT_EXCEEDED",
  message: "Too many requests. Please try again later.",
});

export const jwtOperationRateLimiter = createRateLimiter({
  limit: 30,
  errorCode: "JWT_RATE_LIMIT_EXCEEDED",
  message: "Too many JWT operations. Please wait before trying again.",
});