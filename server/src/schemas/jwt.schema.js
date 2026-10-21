import { z } from "zod";

const algorithmSchema = z.enum([
  "HS256",
  "RS256",
  "ES256",
  "PS256",
]);

const keySchema = z
  .string()
  .min(1, "A cryptographic key is required.")
  .max(10_000, "The cryptographic key is too large.")
  .refine(
    (key) => key.trim().length > 0,
    "A cryptographic key is required."
  );

export const generateJwtSchema = z.object({
  algorithm: algorithmSchema,

  payload: z
    .record(z.string(), z.unknown())
    .refine(
      (payload) => Object.keys(payload).length <= 100,
      "The payload contains too many top-level properties."
    ),

  key: keySchema,

  expiresIn: z
    .string()
    .min(1)
    .max(100)
    .optional(),
});

export const decodeJwtSchema = z.object({
  token: z
    .string()
    .min(1, "A JWT is required.")
    .max(16_384, "The token is too large."),
});

export const verifyJwtSchema = z.object({
  token: z
    .string()
    .min(1, "A JWT is required.")
    .max(16_384, "The token is too large."),

  algorithm: algorithmSchema,

  key: keySchema,
});