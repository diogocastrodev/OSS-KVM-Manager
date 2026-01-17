import { getPrivatePemBuffer, getPublicPemBuffer } from "@/plugins/jose";
import { EncryptJWT, jwtDecrypt } from "jose";
import { createPrivateKey } from "node:crypto";
import type { RawData } from "ws";

interface CreateVirtualSessionEncryptTokenParams {
  email: string;
  vm: number;
  targetHost: string;
  targetPort: number;
}

export const createVirtualSessionEncryptToken = async ({
  email,
  vm,
  targetHost,
  targetPort,
}: CreateVirtualSessionEncryptTokenParams) => {
  return await new EncryptJWT({
    email,
    vm,
    targetHost,
    targetPort,
    aud: "sshterm",
    typ: "vm-console",
  })
    .setProtectedHeader({ alg: "RSA-OAEP-256", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .encrypt(getPublicPemBuffer());
};

export const decryptVirtualSessionEncryptToken = async (
  token: string
): Promise<CreateVirtualSessionEncryptTokenParams> => {
  const { payload } = await jwtDecrypt<CreateVirtualSessionEncryptTokenParams>(
    token,
    getPrivatePemBuffer(),
    {
      audience: "sshterm",
    }
  );

  if (payload.typ !== "vm-console") {
    throw new Error("Wrong token type");
  }

  if (
    !payload.email ||
    !payload.vm ||
    !payload.targetHost ||
    !payload.targetPort
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    email: payload.email,
    vm: payload.vm,
    targetHost: payload.targetHost,
    targetPort: payload.targetPort,
  };
};

export function rawDataToBuffer(data: RawData): Buffer {
  if (typeof data === "string") return Buffer.from(data);
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  // Buffer[] case
  return Buffer.concat(data);
}
