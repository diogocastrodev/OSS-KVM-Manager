import z from "zod";

export const GetOSAvailableResponse = z
  .object({
    os: z.string(),
    versions: z
      .object({
        id: z.string(),
        version: z.string(),
        arch: z.string(),
        status: z.string(),
      })
      .array(),
  })
  .array();

export type GetOSAvailableResponseType = z.infer<typeof GetOSAvailableResponse>;
