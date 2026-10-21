import "dotenv/config";

import mongoose from "mongoose";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

async function startServer() {
  let server;

  try {
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      console.log(
        `JWT Generator API running on http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error("Server startup failed.", {
      errorName: error?.name || "UnknownError",
      errorCode:
        typeof error?.code === "string" ||
        typeof error?.code === "number"
          ? error.code
          : "SERVER_STARTUP_FAILED",
    });

    process.exitCode = 1;

    return;
  }

  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully.`);

    server.close(async () => {
      try {
        await mongoose.disconnect();

        process.exitCode = 0;
      } catch {
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer();

