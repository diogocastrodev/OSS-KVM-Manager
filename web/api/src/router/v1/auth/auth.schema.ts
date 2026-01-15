import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Register                                  */
/* -------------------------------------------------------------------------- */

// const registerRequestBody = z.object({
//   email: z.email(),
//   password: z.string().min(6),
//   name: z.string().min(1),
// });

// type registerRequestBodyType = z.infer<typeof registerRequestBody>;

// const registerReplyBody = z.object({
//   message: z.string(),
// });

// type registerReplyBodyType = z.infer<typeof registerReplyBody>;

/* -------------------------------------------------------------------------- */
/*                              Confirm Email GET                             */
/* -------------------------------------------------------------------------- */
export const confirmEmailParams = z.object({
  token: z.uuid(),
});

export type confirmEmailParamsType = z.infer<typeof confirmEmailParams>;

export const confirmEmailGetReplyBody = z.object({
  message: z.string().default("Token is valid"),
});

export type confirmEmailGetReplyBodyType = z.infer<
  typeof confirmEmailGetReplyBody
>;

/* -------------------------------------------------------------------------- */
/*                             Confirm Email POST                             */
/* -------------------------------------------------------------------------- */
export const confirmEmailPostRequestBody = z.object({
  token: z.uuid(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export type confirmEmailPostRequestBodyType = z.infer<
  typeof confirmEmailPostRequestBody
>;

export const confirmEmailPostReplyBody = z.object({
  message: z.string().default("Email confirmed successfully"),
});

export type confirmEmailPostReplyBodyType = z.infer<
  typeof confirmEmailPostReplyBody
>;

/* -------------------------------------------------------------------------- */
/*                                Confirm Email                               */
/* -------------------------------------------------------------------------- */
export const confirmEmailRequestBody = z.object({
  token: z.uuid(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export type registerRequestBodyType = z.infer<typeof confirmEmailRequestBody>;

export const registerReplyBody = z.object({
  message: z.string().default("Email confirmed successfully"),
});

export type registerReplyBodyType = z.infer<typeof registerReplyBody>;

/* -------------------------------------------------------------------------- */
/*                           Password Reset Request                           */
/* -------------------------------------------------------------------------- */
export const passwordResetRequestBody = z.object({
  email: z.email(),
});

export type passwordResetRequestBodyType = z.infer<
  typeof passwordResetRequestBody
>;

export const passwordResetRequestReplyBody = z.object({
  message: z
    .string()
    .default(
      "If an account with that email exists, a password reset link has been sent."
    ),
});

export type passwordResetRequestReplyBodyType = z.infer<
  typeof passwordResetRequestReplyBody
>;
/* -------------------------------------------------------------------------- */
/*                               Password Reset                               */
/* -------------------------------------------------------------------------- */
export const passwordResetBody = z.object({
  token: z.uuid(),
  password: z.string().min(8),
});

export type passwordResetBodyType = z.infer<typeof passwordResetBody>;

export const passwordResetReplyBody = z.object({
  message: z.string().default("Password has been reset successfully"),
});

export type passwordResetReplyBodyType = z.infer<typeof passwordResetReplyBody>;
/* -------------------------------------------------------------------------- */
/*                                    Login                                   */
/* -------------------------------------------------------------------------- */
export const loginRequestBody = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type loginRequestBodyType = z.infer<typeof loginRequestBody>;

export const loginReplyBody = z.object({
  accessToken: z.string(),
});
export const loginReplyBodyError = z.object({
  message: z.string(),
});

export type loginReplyBodyType =
  | z.infer<typeof loginReplyBody>
  | z.infer<typeof loginReplyBodyError>;

/* -------------------------------------------------------------------------- */
/*                                   Refresh                                  */
/* -------------------------------------------------------------------------- */
export const refreshReplyBody = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const refreshReplyBodyError = z.object({
  message: z.string(),
});

export type refreshReplyBodyType =
  | z.infer<typeof refreshReplyBody>
  | z.infer<typeof refreshReplyBodyError>;

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */
