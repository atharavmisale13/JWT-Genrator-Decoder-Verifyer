import { Router } from "express";
import mongoose from "mongoose";

import { successResponse } from "../utils/response.js";

const router = Router();

router.get("/", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return successResponse(res, {
    service: "jwt-generator-api",
    status: "healthy",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

export default router;