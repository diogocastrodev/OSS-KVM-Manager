import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           Get My Virtual machines                          */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                          Get Virtual Machine By ID                         */
/* -------------------------------------------------------------------------- */
export const getVirtualMachineByIdParamsSchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "vmPublicId must be a number")
    .transform(Number),
});

export type GetVirtualMachineByIdParams = z.infer<
  typeof getVirtualMachineByIdParamsSchema
>;

/* -------------------------------------------------------------------------- */
/*                           Format Virtual Machine                           */
/* -------------------------------------------------------------------------- */
export const formatVirtualMachineParamsSchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "vmPublicId must be a number")
    .transform(Number),
});

export type FormatVirtualMachineParams = z.infer<
  typeof formatVirtualMachineParamsSchema
>;

export const formatVirtualMachineBodySchema = z.object({
  os: z.string(),
  host: z.object({
    hostname: z.string(),
    username: z.string(),
    password: z.string().optional(),
    publicKey: z.string().optional(),
  }),
});

export type FormatVirtualMachineBody = z.infer<
  typeof formatVirtualMachineBodySchema
>;

export const formatVirtualMachineResponseSchema = z.object({
  message: z.string(),
});

export type FormatVirtualMachineResponse = z.infer<
  typeof formatVirtualMachineResponseSchema
>;

/* -------------------------------------------------------------------------- */
/*                               Virtual Session                              */
/* -------------------------------------------------------------------------- */
export const createVirtualSessionBodySchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "vmPublicId must be a number")
    .transform(Number),
});

export type CreateVirtualSessionBody = z.infer<
  typeof createVirtualSessionBodySchema
>;

export const createVirtualSessionResponseSchema = z.object({
  token: z.string(),
});

export type CreateVirtualSessionResponse = z.infer<
  typeof createVirtualSessionResponseSchema
>;

/* -------------------------------------------------------------------------- */
/*                              Change VM Status                              */
/* -------------------------------------------------------------------------- */
export const changeVMStatusParamsSchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "vmPublicId must be a number")
    .transform(Number),
});

export type ChangeVMStatusParams = z.infer<typeof changeVMStatusParamsSchema>;

export const changeVMStatusBodySchema = z.object({
  action: z.enum(["start", "stop", "restart", "kill"]),
});

export type ChangeVMStatusBody = z.infer<typeof changeVMStatusBodySchema>;

export const changeVMStatusResponseSchema = z.object({
  message: z.string(),
});

export type ChangeVMStatusResponse = z.infer<
  typeof changeVMStatusResponseSchema
>;
