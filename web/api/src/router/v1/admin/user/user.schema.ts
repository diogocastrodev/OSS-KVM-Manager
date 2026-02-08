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

/* -------------------------------------------------------------------------- */
/*                              Get Users By Page                             */
/* -------------------------------------------------------------------------- */
export const getUsersByPageQuery = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  search: z.string().optional(),
});

export type GetUsersByPageQueryType = z.infer<typeof getUsersByPageQuery>;

export const getUsersByPageReplyBody = z.object({
  users: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      status: z.string(),
      deactivationReason: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .array(),
  total: z.number(),
});

export type GetUsersByPageReplyBodyType = z.infer<
  typeof getUsersByPageReplyBody
>;

/* -------------------------------------------------------------------------- */
/*                                 Update User                                */
/* -------------------------------------------------------------------------- */
export const updateUserAdminRequestParams = z.object({
  id: z.string(),
});

export type UpdateUserAdminRequestParamsType = z.infer<
  typeof updateUserAdminRequestParams
>;

export const updateUserAdminRequestBody = z.object({
  name: z.string({
    error: "Name is required",
  }),
  email: z.email({
    error: "Invalid email address",
  }),
  role: z.enum(["USER", "ADMIN"], {
    error: "Role must be either USER or ADMIN",
  }),
  status: z.enum(["ACTIVE", "DEACTIVATED", "PENDING"], {
    error: "Status must be either ACTIVE, DEACTIVATED, or PENDING",
  }),
  deactivationReason: z
    .enum(["OTHER", "TERMS_OF_SERVICE_VIOLATION", "USER_REQUEST"], {
      error:
        "Deactivation reason must be either OTHER, TERMS_OF_SERVICE_VIOLATION, or USER_REQUEST",
    })
    .optional(),
});

export type UpdateUserAdminRequestBodyType = z.infer<
  typeof updateUserAdminRequestBody
>;

export const updateUserAdminReplyBody = z.object({
  message: z.string().default("User updated successfully"),
});

export type UpdateUserAdminReplyBodyType = z.infer<
  typeof updateUserAdminReplyBody
>;

/* -------------------------------------------------------------------------- */
/*                          Force Email Verification                          */
/* -------------------------------------------------------------------------- */
export const forceEmailVerificationRequestParams = z.object({
  id: z.string(),
});

export type ForceEmailVerificationRequestParamsType = z.infer<
  typeof forceEmailVerificationRequestParams
>;

export const forceEmailVerificationReplyBody = z.object({
  message: z.string().default("Email verification forced successfully"),
});

export type ForceEmailVerificationReplyBodyType = z.infer<
  typeof forceEmailVerificationReplyBody
>;
