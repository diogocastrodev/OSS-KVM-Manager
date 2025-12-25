import crypto from "crypto";

const generateRefreshToken = (): string => {
  const h1 = crypto.randomBytes(32).toString("base64url");
  const h2 = crypto.createHash("sha256").update(h1).digest("hex");
  return h2;
};

export default generateRefreshToken;
