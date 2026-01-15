import argon2 from "argon2";

export const passwordVerify = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    console.error("Error verifying password:", err);
    return false;
  }
};
export const passwordHash = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 8 * 1024, // 8 MiB
      timeCost: 2,
      parallelism: 1,
    });
  } catch (err) {
    console.error("Error hashing password:", err);
    throw new Error("Password hashing failed");
  }
};
