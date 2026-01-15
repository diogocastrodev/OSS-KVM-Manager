import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                 My Servers                                 */
/* -------------------------------------------------------------------------- */

export const getMyServersParamsSchema = z
  .object({
    include_virtual_machines: z.string().regex(/^(true|false)$/, {
      message: "include_virtual_machines must be 'true' or 'false'",
    }),
  })
  .optional();

export type getMyServersParamsSchemaType = z.infer<
  typeof getMyServersParamsSchema
>;

export const getMyServersReplyBody = z.object({
  servers: z.array(
    z.object({
      publicId: z.number(),
      name: z.string(),
      virtual_machines: z
        .object({
          publicId: z.number(),
          name: z.string(),
          status: z.string(),
        })
        .array()
        .optional(),
    })
  ),
});

export type getMyServersReplyBodyType = z.infer<typeof getMyServersReplyBody>;
