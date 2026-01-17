import { existsSync, readFileSync } from "node:fs";
import { importSPKI, exportJWK } from "jose";
import { calculateJwkThumbprint } from "jose/jwk/thumbprint";
import { createPrivateKey, createPublicKey } from "node:crypto";

let cached: { kid: string; jwks: { keys: any[] } } | null = null;

export const getPrivatePemString = () => {
  const file = "./jwt_keys/jwt-private.pem";
  // Check if the file exists
  if (!existsSync(file)) {
    throw new Error(`Private key file not found: ${file}`);
  }

  const content = readFileSync(file, "utf8");
  if (!content.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "Loaded private key does not look like PEM. First 80 chars: " +
        content.slice(0, 80)
    );
  }

  return content;
};

export const getPublicPemString = () => {
  const file = "./jwt_keys/jwt-public.pem";
  // Check if the file exists
  if (!existsSync(file)) {
    throw new Error(`Public key file not found: ${file}`);
  }
  const content = readFileSync(file, "utf8");
  if (!content.includes("BEGIN PUBLIC KEY")) {
    throw new Error(
      "Loaded public key does not look like PEM. First 80 chars: " +
        content.slice(0, 80)
    );
  }

  return content;
};

export const getPrivatePemBuffer = () => {
  return createPrivateKey({
    key: getPrivatePemString(),
    format: "pem",
    type: "pkcs8",
  });
};

export const getPublicPemBuffer = () => {
  return createPublicKey({
    key: getPublicPemString(),
    format: "pem",
    type: "spki",
  });
};

export async function initJwks() {
  if (cached) return cached;

  const publicPem = getPublicPemString();

  // Convert PEM -> JWK and compute a stable kid (thumbprint)
  const key = await importSPKI(publicPem, "RS256");
  const jwk = await exportJWK(key);
  const kid = await calculateJwkThumbprint(jwk);

  const jwks = {
    keys: [{ ...jwk, kid, use: "sig", alg: "RS256" }],
  };

  cached = { kid, jwks };
  return cached;
}

export function getKid() {
  if (!cached)
    throw new Error("JWKS not initialized. Call initJwks() at startup.");
  return cached.kid;
}

export function getJwks() {
  if (!cached)
    throw new Error("JWKS not initialized. Call initJwks() at startup.");
  return cached.jwks;
}
