import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           Get My Virtual machines                          */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                          Get Virtual Machine By ID                         */
/* -------------------------------------------------------------------------- */
export const getVirtualMachineByIdParamsSchema = z.object({
  vmPublicId: z.int(),
});

export type GetVirtualMachineByIdParams = z.infer<
  typeof getVirtualMachineByIdParamsSchema
>;
