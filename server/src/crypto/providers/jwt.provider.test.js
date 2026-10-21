import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  signJwt,
  verifyJwt,
} from "./jwt.provider.js";

const TEST_PAYLOAD = {
  sub: "test-user",
  role: "tester",
};

const TEST_SECRET =
  "test-only-secret-with-sufficient-length-123456";

// Read locally generated test keys.
const rsaPrivateKey = readFileSync(
  new URL("../../../test-keys/rsa-private.pem", import.meta.url),
  "utf8"
);

const rsaPublicKey = readFileSync(
  new URL("../../../test-keys/rsa-public.pem", import.meta.url),
  "utf8"
);

const ecPrivateKey = readFileSync(
  new URL("../../../test-keys/ec-private.pem", import.meta.url),
  "utf8"
);

const ecPublicKey = readFileSync(
  new URL("../../../test-keys/ec-public.pem", import.meta.url),
  "utf8"
);

describe("JWT Cryptographic Provider", () => {
  test("signs and verifies an HS256 token", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    const result = await verifyJwt({
      token,
      algorithm: "HS256",
      key: TEST_SECRET,
    });

    expect(result.header.alg).toBe("HS256");
    expect(result.payload.sub).toBe("test-user");
    expect(result.payload.role).toBe("tester");
  });

  test("signs and verifies an RS256 token", async () => {
    const token = await signJwt({
      algorithm: "RS256",
      payload: TEST_PAYLOAD,
      key: rsaPrivateKey,
    });

    const result = await verifyJwt({
      token,
      algorithm: "RS256",
      key: rsaPublicKey,
    });

    expect(result.header.alg).toBe("RS256");
    expect(result.payload.sub).toBe("test-user");
  });

  test("signs and verifies an ES256 token", async () => {
    const token = await signJwt({
      algorithm: "ES256",
      payload: TEST_PAYLOAD,
      key: ecPrivateKey,
    });

    const result = await verifyJwt({
      token,
      algorithm: "ES256",
      key: ecPublicKey,
    });

    expect(result.header.alg).toBe("ES256");
    expect(result.payload.sub).toBe("test-user");
  });

  test("signs and verifies a PS256 token", async () => {
    const token = await signJwt({
      algorithm: "PS256",
      payload: TEST_PAYLOAD,
      key: rsaPrivateKey,
    });

    const result = await verifyJwt({
      token,
      algorithm: "PS256",
      key: rsaPublicKey,
    });

    expect(result.header.alg).toBe("PS256");
    expect(result.payload.sub).toBe("test-user");
  });

  test("rejects an unsupported signing algorithm", async () => {
    await expect(
      signJwt({
        algorithm: "HS512",
        payload: TEST_PAYLOAD,
        key: TEST_SECRET,
      })
    ).rejects.toThrow("Unsupported JWT algorithm.");
  });

  test("rejects an unsupported verification algorithm", async () => {
    await expect(
      verifyJwt({
        token: "header.payload.signature",
        algorithm: "HS512",
        key: TEST_SECRET,
      })
    ).rejects.toThrow("Unsupported JWT algorithm.");
  });

  test("rejects verification with the wrong HS256 secret", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    await expect(
      verifyJwt({
        token,
        algorithm: "HS256",
        key: "incorrect-test-secret-with-sufficient-length",
      })
    ).rejects.toThrow();
  });

  test("rejects an HS256 token when RS256 is selected", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    await expect(
      verifyJwt({
        token,
        algorithm: "RS256",
        key: rsaPublicKey,
      })
    ).rejects.toThrow();
  });

  test("rejects an RS256 token when PS256 is selected", async () => {
    const token = await signJwt({
      algorithm: "RS256",
      payload: TEST_PAYLOAD,
      key: rsaPrivateKey,
    });

    await expect(
      verifyJwt({
        token,
        algorithm: "PS256",
        key: rsaPublicKey,
      })
    ).rejects.toThrow();
  });

  test("rejects a token signed with an EC key when RSA is selected", async () => {
    const token = await signJwt({
      algorithm: "ES256",
      payload: TEST_PAYLOAD,
      key: ecPrivateKey,
    });

    await expect(
      verifyJwt({
        token,
        algorithm: "RS256",
        key: rsaPublicKey,
      })
    ).rejects.toThrow();
  });

  test("rejects an RSA public key used for signing", async () => {
    await expect(
      signJwt({
        algorithm: "RS256",
        payload: TEST_PAYLOAD,
        key: rsaPublicKey,
      })
    ).rejects.toThrow();
  });

  test("rejects a private RSA key where a public key is required", async () => {
    const token = await signJwt({
      algorithm: "RS256",
      payload: TEST_PAYLOAD,
      key: rsaPrivateKey,
    });

    await expect(
      verifyJwt({
        token,
        algorithm: "RS256",
        key: rsaPrivateKey,
      })
    ).rejects.toThrow();
  });

  test("rejects an RSA key used with ES256", async () => {
    await expect(
      signJwt({
        algorithm: "ES256",
        payload: TEST_PAYLOAD,
        key: rsaPrivateKey,
      })
    ).rejects.toThrow();
  });

  test("rejects an EC key used with RS256", async () => {
    await expect(
      signJwt({
        algorithm: "RS256",
        payload: TEST_PAYLOAD,
        key: ecPrivateKey,
      })
    ).rejects.toThrow();
  });

  test("rejects an empty signing key", async () => {
    await expect(
      signJwt({
        algorithm: "HS256",
        payload: TEST_PAYLOAD,
        key: "   ",
      })
    ).rejects.toThrow("Signing key must be a non-empty string.");
  });

  test("rejects an empty verification key", async () => {
    await expect(
      verifyJwt({
        token: "header.payload.signature",
        algorithm: "HS256",
        key: "   ",
      })
    ).rejects.toThrow("Verification key must be a non-empty string.");
  });

  test("rejects a malformed JWT", async () => {
    await expect(
      verifyJwt({
        token: "not-a-jwt",
        algorithm: "HS256",
        key: TEST_SECRET,
      })
    ).rejects.toThrow();
  });

  test("rejects a tampered JWT", async () => {
    const token = await signJwt({
      algorithm: "HS256",
      payload: TEST_PAYLOAD,
      key: TEST_SECRET,
    });

    const [header, , signature] = token.split(".");

    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: "attacker",
        role: "admin",
      })
    ).toString("base64url");

    const tamperedToken =
      `${header}.${tamperedPayload}.${signature}`;

    await expect(
      verifyJwt({
        token: tamperedToken,
        algorithm: "HS256",
        key: TEST_SECRET,
      })
    ).rejects.toThrow();
  });
});