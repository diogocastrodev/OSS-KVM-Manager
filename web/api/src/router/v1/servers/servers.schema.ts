import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                               Get All Servers                              */
/* -------------------------------------------------------------------------- */
export const getServersReplyBody = z.object({
  servers: z.array(
    z.object({
      publicId: z.number(),
      name: z.string(),
    })
  ),
});
export type getServersReplyBodyType = z.infer<typeof getServersReplyBody>;

/* -------------------------------------------------------------------------- */
/*                               Get One Server                               */
/* -------------------------------------------------------------------------- */

export const getOneServerParamsSchema = z.object({
  serverId: z
    .string()
    .regex(/^\d+$/, "serverId must be a number")
    .transform(Number),
});
export type getOneServerParamsSchemaType = z.infer<
  typeof getOneServerParamsSchema
>;

export const getOneServerReplyBody = z.object({
  server: z.object({
    publicId: z.number(),
    name: z.string(),
  }),
});
export type getOneServerReplyBodyType = z.infer<typeof getOneServerReplyBody>;

/* -------------------------------------------------------------------------- */
/*                                  Try Info                                  */
/* -------------------------------------------------------------------------- */
export const tryInfoRequestBody = z.object({
  server_endpoint: z
    .string()
    .regex(
      /^(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]):(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)$/,
      "Invalid IP:PORT address format"
    ),
});

export type tryInfoRequestBodyType = z.infer<typeof tryInfoRequestBody>;

export const tryInfoReplyBody = z.object({
  message: z.string(),
});

export type tryInfoReplyBodyType = z.infer<typeof tryInfoReplyBody>;
