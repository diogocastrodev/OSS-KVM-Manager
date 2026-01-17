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
