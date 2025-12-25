import z from "zod";

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
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export {
  registerRequestBody,
  registerReplyBody,
  loginRequestBody,
  loginReplyBody,
  loginReplyBodyError,
};
export type {
  registerRequestBodyType,
  registerReplyBodyType,
  loginRequestBodyType,
  loginReplyBodyType,
};
