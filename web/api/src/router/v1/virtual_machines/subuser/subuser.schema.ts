import { VirtualMachineUserRole } from "@/db/schema";
import { z } from "zod";

export const SubUserParamsSchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "vmPublicId must be a number")
    .transform(Number),
});
export type SubUserParams = z.infer<typeof SubUserParamsSchema>;
/* -------------------------------------------------------------------------- */
/*                              Get All SubUsers                              */
/* -------------------------------------------------------------------------- */

export const GetAllSubusersResponseSchema = z
  .object({
    subUserId: z.string(),
    subUserName: z.string(),
    subUserEmail: z.email(),
    subUserRole: z.string(),
  })
  .array();
export type GetAllSubusersResponse = z.infer<
  typeof GetAllSubusersResponseSchema
>;
/* -------------------------------------------------------------------------- */
/*                               Create SubUser                               */
/* -------------------------------------------------------------------------- */
export const CreateUserBodySchema = z.object({
  email: z.email(),
  // role: z
  //   .string()
  //   .refine((val) => {
  //     return Object.values(VirtualMachineUserRole).includes(
  //       val.toUpperCase() as VirtualMachineUserRole,
  //     );
  //   }, "Invalid role")
  //   .transform((val) => val.toUpperCase() as VirtualMachineUserRole),
  role: z
    .string({ error: "Role is required" })
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(VirtualMachineUserRole, { error: "Invalid role" })),
});
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;

export const CreateUserResponseSchema = z.object({
  message: z.string(),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

/* -------------------------------------------------------------------------- */
/*                                 Update User                                */
/* -------------------------------------------------------------------------- */
export const UpdateUserBodySchema = z.object({
  subUserId: z.string(),
  role: z
    .string({ error: "Role is required" })
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(VirtualMachineUserRole, { error: "Invalid role" })),
});
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;

export const UpdateUserResponseSchema = z.object({
  message: z.string(),
});
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;

/* -------------------------------------------------------------------------- */
/*                               Delete Subuser                               */
/* -------------------------------------------------------------------------- */
export const DeleteSubUserBodySchema = z.object({
  subUserId: z.string(),
});
export type DeleteSubUserBody = z.infer<typeof DeleteSubUserBodySchema>;

export const DeleteSubUserResponseSchema = z.object({
  message: z.string(),
});
export type DeleteSubUserResponse = z.infer<typeof DeleteSubUserResponseSchema>;
