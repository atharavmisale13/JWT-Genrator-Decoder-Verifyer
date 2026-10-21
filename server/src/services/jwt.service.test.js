import { readFileSync } from "node:fs";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  generateJwt,
  decodeToken,
  verifyToken,
} from "./jwt.service.js";

import * as jwtProvider from "../crypto/providers/jwt.provider.js";

const TEST_PAYLOAD = {
  sub: "test-user",
  role: "tester",
};

const TEST_SECRET =
  "test-only-secret-with-sufficient-length-123456";

const WEAK_SECRET = "short-secret";

const rsaPrivateKey = readFileSync(
  new URL("../../test-keys/rsa-private.pem", import.meta.url),
  "utf8"
);

const rsaPublicKey = readFileSync(
  new URL("../../test-keys/rsa-public.pem", import.meta.url),
  "utf8"
);

const ecPrivateKey = readFileSync(
  new URL("../../test-keys/ec-private.pem", import.meta.url),
  "utf8"
);

const ecPublicKey = readFileSync(
  new URL("../../test-keys/ec-public.pem", import.meta.url),
  "utf8"
);

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// JWT SERVICE — GENERATION
// ============================================================

describe("JWT Service — Generation", () => {
  test("generates a valid HS256 token", async () => {
    const result = await generateJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    expect(result.token).toBeTypeOf("string");
    expect(result.algorithm).toBe("HS256");
    expect(result.tokenType).toBe("Bearer");
    expect(result.expiresIn).toBe("1h");

    const verified = await verifyToken({
      token: result.token,
      algorithm: "HS256",
      key: TEST_SECRET,
    });

    expect(verified.verified).toBe(true);
    expect(verified.payload.sub).toBe("test-user");
  });

  test.each(["RS256", "ES256", "PS256"])(
    "generates and verifies a %s token",
    async (algorithm) => {
      const privateKey =
        algorithm === "ES256" ? ecPrivateKey : rsaPrivateKey;

      const publicKey =
        algorithm === "ES256" ? ecPublicKey : rsaPublicKey;

      const result = await generateJwt({
        algorithm,
        payload: TEST_PAYLOAD,
        key: privateKey,
      });

      expect(result.algorithm).toBe(algorithm);
      expect(result.token).toBeTypeOf("string");

      const verified = await verifyToken({
        token: result.token,
        algorithm,
        key: publicKey,
      });

      expect(verified.verified).toBe(true);
      expect(verified.payload.sub).toBe("test-user");
    }
  );

  test("rejects an unsupported algorithm", async () => {
    await expect(
      generateJwt({
        algorithm: "HS512",
        payload: TEST_PAYLOAD,
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  test.each([
    undefined,
    null,
    [],
    "not-an-object",
    123,
  ])("rejects an invalid payload: %s", async (payload) => {
    await expect(
      generateJwt({
        algorithm: "HS256",
        payload,
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  test.each([undefined, null, "", "   "])(
    "rejects an empty signing key",
    async (key) => {
      await expect(
        generateJwt({
          algorithm: "HS256",
          payload: TEST_PAYLOAD,
          key,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    }
  );

  test("rejects a weak HS256 secret", async () => {
    await expect(
      generateJwt({
        algorithm: "HS256",
        payload: TEST_PAYLOAD,
        key: WEAK_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "WEAK_SIGNING_KEY",
    });
  });

  test("rejects a secret shorter than 32 UTF-8 bytes", async () => {
    const secret = "é".repeat(16);

    expect(Buffer.byteLength(secret, "utf8")).toBe(32);

    await expect(
      generateJwt({
        algorithm: "HS256",
        payload: TEST_PAYLOAD,
        key: secret.slice(0, 15),
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "WEAK_SIGNING_KEY",
    });
  });

  test("converts unexpected provider errors into a safe API error", async () => {
    vi.spyOn(jwtProvider, "signJwt").mockRejectedValueOnce(
      new Error("sensitive internal provider details")
    );

    await expect(
      generateJwt({
        algorithm: "HS256",
        payload: TEST_PAYLOAD,
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "JWT_GENERATION_FAILED",
      message:
        "JWT generation failed. Check the signing key and request data.",
    });
  });

  test("uses the requested expiration duration", async () => {
    const result = await generateJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
      expiresIn: "30m",
    });

    expect(result.expiresIn).toBe("30m");

    const verified = await verifyToken({
      token: result.token,
      algorithm: "HS256",
      key: TEST_SECRET,
    });

    expect(verified.verified).toBe(true);
    expect(verified.claims.expiresAt).toBeTypeOf("number");
    expect(verified.claims.issuedAt).toBeTypeOf("number");

    expect(
      verified.claims.expiresAt - verified.claims.issuedAt
    ).toBe(30 * 60);
  });
});

// ============================================================
// JWT SERVICE — DECODING
// ============================================================

describe("JWT Service — Decoding", () => {
  test("decodes a valid token without claiming it is verified", async () => {
    const generated = await generateJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    const result = decodeToken(generated.token);

    expect(result.header.alg).toBe("HS256");
    expect(result.payload.sub).toBe("test-user");
    expect(result.verified).toBe(false);
  });

  test.each([undefined, null, "", "   "])(
    "rejects an empty token",
    (token) => {
      expect(() => decodeToken(token)).toThrowError(
        expect.objectContaining({
          statusCode: 400,
          code: "VALIDATION_ERROR",
        })
      );
    }
  );

  test.each([
    "one.two",
    "one.two.three.four",
    ".payload.signature",
    "header..signature",
    "header.payload.",
  ])("rejects malformed JWT structure: %s", (token) => {
    expect(() => decodeToken(token)).toThrowError(
      expect.objectContaining({
        statusCode: 400,
        code: "MALFORMED_JWT",
      })
    );
  });

  test("rejects malformed JWT encoding", () => {
    expect(() =>
      decodeToken("not-json.!.signature")
    ).toThrowError(
      expect.objectContaining({
        statusCode: 400,
        code: "MALFORMED_JWT",
      })
    );
  });
});

// ============================================================
// JWT SERVICE — VERIFICATION
// ============================================================

describe("JWT Service — Verification", () => {
  async function createValidToken() {
    const result = await generateJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    return result.token;
  }

  test("returns verified claims for a valid token", async () => {
    const validToken = await createValidToken();

    const result = await verifyToken({
      token: validToken,
      algorithm: "HS256",
      key: TEST_SECRET,
    });

    expect(result.verified).toBe(true);
    expect(result.algorithm).toBe("HS256");
    expect(result.claims.subject).toBe("test-user");
    expect(result.claims.issuer).toBeNull();
    expect(result.claims.audience).toBeNull();
  });

  test("rejects a missing token", async () => {
    await expect(
      verifyToken({
        algorithm: "HS256",
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  test.each([undefined, null, "", "   "])(
    "rejects an empty verification key",
    async (key) => {
      const validToken = await createValidToken();

      await expect(
        verifyToken({
          token: validToken,
          algorithm: "HS256",
          key,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    }
  );

  test("rejects an unsupported verification algorithm", async () => {
    const validToken = await createValidToken();

    await expect(
      verifyToken({
        token: validToken,
        algorithm: "HS512",
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  test("rejects a token signed with the wrong secret", async () => {
    const validToken = await createValidToken();

    await expect(
      verifyToken({
        token: validToken,
        algorithm: "HS256",
        key: "another-test-secret-with-sufficient-length",
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "JWT_VERIFICATION_FAILED",
    });
  });

  test("rejects a tampered token", async () => {
    const validToken = await createValidToken();

    const [header, , signature] = validToken.split(".");

    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: "attacker",
        role: "admin",
      })
    ).toString("base64url");

    const tamperedToken =
      `${header}.${tamperedPayload}.${signature}`;

    await expect(
      verifyToken({
        token: tamperedToken,
        algorithm: "HS256",
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "JWT_VERIFICATION_FAILED",
    });
  });

  test("rejects an algorithm mismatch", async () => {
    const validToken = await createValidToken();

    await expect(
      verifyToken({
        token: validToken,
        algorithm: "RS256",
        key: rsaPublicKey,
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "JWT_VERIFICATION_FAILED",
    });
  });

  test("rejects a token with an expired expiration claim", async () => {
    const { SignJWT } = await import("jose");

    const expiredToken = await new SignJWT(TEST_PAYLOAD)
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setExpirationTime("0s")
      .sign(new TextEncoder().encode(TEST_SECRET));

    await expect(
      verifyToken({
        token: expiredToken,
        algorithm: "HS256",
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "JWT_VERIFICATION_FAILED",
    });
  });

  test("rejects a token with a future not-before claim", async () => {
    const { SignJWT } = await import("jose");

    const now = Math.floor(Date.now() / 1000);

    const futureToken = await new SignJWT(TEST_PAYLOAD)
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setNotBefore(now + 10 * 60)
      .setExpirationTime(now + 60 * 60)
      .sign(new TextEncoder().encode(TEST_SECRET));

    await expect(
      verifyToken({
        token: futureToken,
        algorithm: "HS256",
        key: TEST_SECRET,
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "JWT_VERIFICATION_FAILED",
    });
  });
});