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
