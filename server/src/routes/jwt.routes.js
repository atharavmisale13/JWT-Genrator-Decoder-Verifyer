import { Router } from "express";

import {
  generateJwtController,
  decodeJwtController,
  verifyJwtController,
} from "../controllers/jwt.controller.js";

import {
  generateJwtSchema,
  decodeJwtSchema,
  verifyJwtSchema,
} from "../schemas/jwt.schema.js";

import { validate } from "../middleware/validation.middleware.js";

import {
  jwtOperationRateLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = Router();

// Apply rate limiting before processing JWT operations.
router.use(jwtOperationRateLimiter);

// Generate JWT.
router.post(
  "/generate",
  validate(generateJwtSchema),
  generateJwtController
);

// Decode JWT without claiming it has been verified.
router.post(
  "/decode",
  validate(decodeJwtSchema),
  decodeJwtController
);

// Verify JWT signature and claims.
router.post(
  "/verify",
  validate(verifyJwtSchema),
  verifyJwtController
);

export default router;