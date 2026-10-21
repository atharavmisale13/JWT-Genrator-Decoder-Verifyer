import { ApiError } from "../utils/ApiError.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new ApiError(
          "The request contains invalid data.",
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    req.body = result.data;

    return next();
  };
}