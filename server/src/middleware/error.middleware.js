import { ApiError } from "../utils/ApiError.js";

/**
 * Centralized Express error middleware.
 *
 * Handles malformed JSON, oversized request bodies,
 * known application errors, and unexpected server errors.
 */
export function errorMiddleware(err, req, res, next) {
  // Do not attempt to send a second response.
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.requestId;

  // Request body exceeds the configured Express JSON limit.
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "The request body exceeds the allowed size.",
      },
      requestId,
    });
  }

  // Request body contains malformed JSON.
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "MALFORMED_JSON",
        message: "The request body contains invalid JSON.",
      },
      requestId,
    });
  }

  // Handle known application errors.
  if (err instanceof ApiError) {
    const statusCode = err.statusCode;

    if (
      Number.isInteger(statusCode) &&
      statusCode >= 400 &&
      statusCode < 500
    ) {
      const response = {
        success: false,
        error: {
          code: err.code || "REQUEST_ERROR",
          message:
            typeof err.message === "string"
              ? err.message
              : "The request could not be processed.",
        },
        requestId,
      };

      // Only include explicitly approved, safe details.
      // Never serialize arbitrary error details into responses.
      if (err.details?.safe === true) {
        response.error.details = err.details.data;
      }

      return res.status(statusCode).json(response);
    }

    // Log safe metadata only.
    console.error("Application server error.", {
      requestId,
      errorCode: "INTERNAL_SERVER_ERROR",
      errorName: err.name || "ApiError",
    });

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
      requestId,
    });
  }

  // Unexpected errors: never log raw messages or stack traces.
  console.error("Unexpected server error.", {
    requestId,
    errorName: err?.name || "Error",
  });

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred.",
    },
    requestId,
  });
}