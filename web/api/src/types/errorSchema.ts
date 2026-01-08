import { z } from "zod";

export const UnauthorizedError = z.object({
  message: z.literal("Unauthorized").or(z.string()),
});
export type UnauthorizedErrorType = z.infer<typeof UnauthorizedError>;

export const NotFoundError = z.object({
  message: z.literal("Not Found").or(z.string()),
});
export type NotFoundErrorType = z.infer<typeof NotFoundError>;

export const BadRequestError = z.object({
  message: z.literal("Bad Request").or(z.string()),
});
export type BadRequestErrorType = z.infer<typeof BadRequestError>;

export const InternalServerError = z.object({
  message: z.literal("Internal Server Error").or(z.string()),
});
export type InternalServerErrorType = z.infer<typeof InternalServerError>;
