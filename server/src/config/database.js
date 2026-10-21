import mongoose from "mongoose";

export async function connectDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    const error = new Error("DATABASE_URL is not configured.");

    error.code = "DATABASE_URL_MISSING";

    throw error;
  }

  try {
    await mongoose.connect(databaseUrl);

    console.log("MongoDB connected successfully");
  } catch (cause) {
    const error = new Error("MongoDB connection failed.");

    error.code =
      typeof cause?.code === "string" ||
      typeof cause?.code === "number"
        ? cause.code
        : "MONGODB_CONNECTION_FAILED";

    error.name = cause?.name || "MongoConnectionError";

    console.error("MongoDB connection failed.", {
      errorName: error.name,
      errorCode: error.code,
    });

    throw error;
  }
}