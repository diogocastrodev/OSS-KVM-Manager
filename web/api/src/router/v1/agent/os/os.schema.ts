import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                               Get OS Metadata                              */
/* -------------------------------------------------------------------------- */

export const getOSMetadataParamsSchema = z.object({
  osName: z.string(),
});

export type GetOSMetadataParamsType = z.infer<typeof getOSMetadataParamsSchema>;

export const getOSMetadataReplySchema = z.object({
  id: z.string(),
  type: z.enum(["cloud", "iso"]),
  filename: z.string(),
  sha256: z.string(),
  bytes: z.number(),
});

export type GetOSMetadataReplyType = z.infer<typeof getOSMetadataReplySchema>;

/* -------------------------------------------------------------------------- */
/*                                 Download OS                                */
/* -------------------------------------------------------------------------- */
export const downloadOSParamsSchema = z.object({
  osName: z.string(),
});

export type DownloadOSParamsType = z.infer<typeof downloadOSParamsSchema>;
