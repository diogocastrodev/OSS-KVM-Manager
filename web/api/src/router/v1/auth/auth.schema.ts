import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Register                                  */
/* -------------------------------------------------------------------------- */

const registerRequestBody = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

type registerRequestBodyType = z.infer<typeof registerRequestBody>;

const registerReplyBody = z.object({
  message: z.string(),
});

type registerReplyBodyType = z.infer<typeof registerReplyBody>;

/* -------------------------------------------------------------------------- */
/*                                    Login                                   */
/* -------------------------------------------------------------------------- */
const loginRequestBody = z.object({
  email: z.email(),
  password: z.string().min(6),
});

type loginRequestBodyType = z.infer<typeof loginRequestBody>;

const loginReplyBody = z.object({
  accessToken: z.string(),
});
const loginReplyBodyError = z.object({
  message: z.string(),
});

type loginReplyBodyType =
  | z.infer<typeof loginReplyBody>
  | z.infer<typeof loginReplyBodyError>;

/* -------------------------------------------------------------------------- */
/*                                   Refresh                                  */
/* -------------------------------------------------------------------------- */
const refreshReplyBody = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const refreshReplyBodyError = z.object({
  message: z.string(),
});

type refreshReplyBodyType =
  | z.infer<typeof refreshReplyBody>
  | z.infer<typeof refreshReplyBodyError>;

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export {
  registerRequestBody,
  registerReplyBody,
  loginRequestBody,
  loginReplyBody,
  loginReplyBodyError,
  refreshReplyBody,
  refreshReplyBodyError,
};
export type {
  registerRequestBodyType,
  registerReplyBodyType,
  loginRequestBodyType,
  loginReplyBodyType,
  refreshReplyBodyType,
};
