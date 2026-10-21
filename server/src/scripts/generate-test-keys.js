import {
  generateKeyPairSync,
} from "node:crypto";

import {
  mkdirSync,
  writeFileSync,
} from "node:fs";

import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = fileURLToPath(
  new URL(".", import.meta.url)
);

const keyDirectory = join(
  scriptDirectory,
  "..",
  "test-keys"
);

mkdirSync(keyDirectory, { recursive: true });

function saveKeyPair(name, type, options) {
  const { publicKey, privateKey } = generateKeyPairSync(
    type,
    options
  );

  const privatePem = privateKey.export({
    type: "pkcs8",
    format: "pem",
  });

  const publicPem = publicKey.export({
    type: "spki",
    format: "pem",
  });

  writeFileSync(
    join(keyDirectory, `${name}-private.pem`),
    privatePem,
    { mode: 0o600 }
  );

  writeFileSync(
    join(keyDirectory, `${name}-public.pem`),
    publicPem,
    { mode: 0o600 }
  );

  console.log(`Generated ${name.toUpperCase()} test keys.`);
}

saveKeyPair("rsa", "rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
});

saveKeyPair("ec", "ec", {
  namedCurve: "prime256v1",
});

console.log("\nTest keys generated successfully.");
console.log(`Location: ${keyDirectory}`);