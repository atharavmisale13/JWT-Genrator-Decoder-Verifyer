import dns from 'node:dns/promises';

dns.setServers(["1.1.1.1", "8.8.8.8"]);


import cors from "cors";
import express from "express";
import helmet from "helmet";

import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

import healthRoutes from "./routes/health.routes.js";
import jwtRoutes from "./routes/jwt.routes.js";

import { ApiError } from "./utils/ApiError.js";

export const app = express();

// ============================================
// 1. SECURITY HEADERS
// ============================================

app.use(helmet());

// ============================================
// 2. CORS CONFIGURATION
// ============================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// ============================================
// 3. REQUEST IDENTIFICATION
// ============================================

app.use(requestIdMiddleware);

// ============================================
// 4. GENERAL API RATE LIMITING
// ============================================

app.use("/api/v1", (req, res, next) => {
  if (req.path === "/health" || req.path.startsWith("/jwt/")) {
    return next();
  }

  return apiRateLimiter(req, res, next);
});

// ============================================
// 5. REQUEST BODY PARSING
// ============================================

app.use(
  express.json({
    limit: "100kb",
    strict: true,
  })
);

// ============================================
// 6. HEALTH ROUTES
// ============================================

app.use("/api/v1/health", healthRoutes);

// ============================================
// 7. JWT ROUTES
// ============================================

app.use("/api/v1/jwt", jwtRoutes);

// ============================================
// 8. NOT FOUND HANDLER
// ============================================

app.use((req, res, next) => {
  next(
    new ApiError(
      "The requested endpoint does not exist.",
      404,
      "ROUTE_NOT_FOUND"
    )
  );
});

// ============================================
// 9. CENTRALIZED ERROR HANDLER
// ============================================

app.use(errorMiddleware);