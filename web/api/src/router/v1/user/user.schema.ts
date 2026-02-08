import z from "zod";

/* -------------------------------------------------------------------------- */
/*                                   Profile                                  */
/* -------------------------------------------------------------------------- */

export const userProfileResponseSchema = z.object({
  name: z.string(),
  email: z.email(),
  logins: z
    .object({
      id: z.string(),
      platformName: z.string(),
      createdAt: z.string(),
      lastUsed: z.string(),
    })
    .array(),
});

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

/* -------------------------------------------------------------------------- */
/*                               Update Profile                               */
/* -------------------------------------------------------------------------- */
export const updateUserProfileRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
});

export type UpdateUserProfileRequest = z.infer<
  typeof updateUserProfileRequestSchema
>;

export const updateUserProfileResponseSchema = z.object({
  message: z.string(),
});

export type UpdateUserProfileResponse = z.infer<
  typeof updateUserProfileResponseSchema
>;
/* -------------------------------------------------------------------------- */
/*                               Update Password                              */
/* -------------------------------------------------------------------------- */
export const updateUserPasswordRequestSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type UpdateUserPasswordRequest = z.infer<
  typeof updateUserPasswordRequestSchema
>;

export const updateUserPasswordResponseSchema = z.object({
  message: z.string(),
});

export type UpdateUserPasswordResponse = z.infer<
  typeof updateUserPasswordResponseSchema
>;

/* -------------------------------------------------------------------------- */
/*                                 Delete Auth                                */
/* -------------------------------------------------------------------------- */
export const deleteUserAuthRequestParamsSchema = z.object({
  id: z.uuid("Invalid session ID"),
});

export type DeleteUserAuthRequestParams = z.infer<
  typeof deleteUserAuthRequestParamsSchema
>;

export const deleteUserAuthResponseSchema = z.object({
  message: z.string(),
});

export type DeleteUserAuthResponse = z.infer<
  typeof deleteUserAuthResponseSchema
>;

/* -------------------------------------------------------------------------- */
/*                               Delete all Auth                              */
/* -------------------------------------------------------------------------- */
export const deleteAllUserAuthResponseSchema = z.object({
  message: z.string(),
});

export type DeleteAllUserAuthResponse = z.infer<
  typeof deleteAllUserAuthResponseSchema
>;
