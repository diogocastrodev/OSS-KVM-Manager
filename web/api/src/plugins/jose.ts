import { existsSync, readFileSync } from "node:fs";
import { importSPKI, exportJWK } from "jose";
import { calculateJwkThumbprint } from "jose/jwk/thumbprint";

let cached: { kid: string; jwks: { keys: any[] } } | null = null;

export const getPrivatePem = () => {
  const file = "./jwt_keys/jwt-private.pem";
  // Check if the file exists
  if (!existsSync(file)) {
    throw new Error(`Private key file not found: ${file}`);
  }
  return readFileSync(file, "utf8");
};

export const getPublicPem = () => {
  const file = "./jwt_keys/jwt-public.pem";
  // Check if the file exists
  if (!existsSync(file)) {
    throw new Error(`Public key file not found: ${file}`);
  }
  return readFileSync(file, "utf8");
};

export async function initJwks() {
  if (cached) return cached;

  const publicPem = getPublicPem();

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
