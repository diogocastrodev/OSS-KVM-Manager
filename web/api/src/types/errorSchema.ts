import { z } from "zod";

export const UnauthorizedError = z.object({
  message: z.literal("Unauthorized").or(z.string()),
});
export type UnauthorizedErrorType = z.infer<typeof UnauthorizedError>;

export const NotFoundError = z.object({
  message: z.literal("Not Found").or(z.string()),
});
export type NotFoundErrorType = z.infer<typeof NotFoundError>;
