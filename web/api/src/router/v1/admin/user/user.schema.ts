import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Register User                               */
/* -------------------------------------------------------------------------- */
export const registerUserAdminRequestBody = z.object({
  email: z.email(),
});

export type RegisterUserAdminRequestBodyType = z.infer<
  typeof registerUserAdminRequestBody
>;

export const registerUserAdminReplyBody = z.object({
  message: z.string().default("User registered successfully"),
});

export type RegisterUserAdminReplyBodyType = z.infer<
  typeof registerUserAdminReplyBody
>;
