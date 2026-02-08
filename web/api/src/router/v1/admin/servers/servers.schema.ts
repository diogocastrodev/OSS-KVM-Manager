import { z } from "zod";
/* -------------------------------------------------------------------------- */
/*                               Get All Servers                              */
/* -------------------------------------------------------------------------- */
export const getServersRequestQueryString = z.object({
  include_virtual_machines: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type getServersRequestQueryStringType = z.infer<
  typeof getServersRequestQueryString
>;

export const getServersReplyBody = z.object({
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
    }),
  ),
});
export type getServersReplyBodyType = z.infer<typeof getServersReplyBody>;

/* -------------------------------------------------------------------------- */
/*                               Get One Server                               */
/* -------------------------------------------------------------------------- */

export const getOneServerParamsSchema = z.object({
  publicId: z
    .string()
    .regex(/^\d+$/, "publicId must be a number")
    .transform(Number),
});
export type getOneServerParamsSchemaType = z.infer<
  typeof getOneServerParamsSchema
>;

export const getOneServerReplyBody = z.object({
  publicId: z.number(),
  name: z.string(),
  cpus: z.number(),
  vcpus: z.number(),
  ram: z.number(),
  disk: z.number(),
  in_link: z.number(),
  out_link: z.number(),
  ipLocal: z.string(),
  ipPublic: z.string().nullable(),
  vcpus_max: z.number(),
  ram_max: z.number(),
  disk_max: z.number(),
  vcpus_available: z.number(),
  ram_available: z.number(),
  disk_available: z.number(),
  agent_port: z.number(),
  vms_gateway: z.string().nullable(),
  vms_network: z.string().nullable(),
  vms_network_mask: z.string().nullable(),
  status: z.string(),
  vms_mac_prefix: z.string().nullable(),
  public_key: z.string().nullable(),
});
export type getOneServerReplyBodyType = z.infer<typeof getOneServerReplyBody>;

/* -------------------------------------------------------------------------- */
/*                        Get VMs of a specific server                        */
/* -------------------------------------------------------------------------- */
export const getVMsOfServerParamsSchema = z.object({
  publicId: z
    .string()
    .regex(/^\d+$/, "publicId must be a number")
    .transform(Number),
});
export type getVMsOfServerParamsSchemaType = z.infer<
  typeof getVMsOfServerParamsSchema
>;

export const getVMsOfServerReplyBody = z.object({
  vms: z
    .object({
      publicId: z.number(),
      name: z.string(),
      status: z.string(),
      vcpus: z.number(),
      ram: z.number(),
      disk: z.number(),
      ipLocal: z.string(),
      ipPublic: z.string().nullable(),
    })
    .array(),
});
export type getVMsOfServerReplyBodyType = z.infer<
  typeof getVMsOfServerReplyBody
>;

/* -------------------------------------------------------------------------- */
/*                                  Try Info                                  */
/* -------------------------------------------------------------------------- */
export const tryInfoRequestBody = z.object({
  server_endpoint: z
    .string()
    .regex(
      /^(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]):(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)$/,
      "Invalid IP:PORT address format",
    ),
});

export type tryInfoRequestBodyType = z.infer<typeof tryInfoRequestBody>;

export const tryInfoReplyBody = z.object({
  message: z.string(),
  info: z.object({
    cpus: z.number(),
    vcpus: z.number(),
    memory_mb: z.number(),
    disk: z.number(),
  }),
});

export type tryInfoReplyBodyType = z.infer<typeof tryInfoReplyBody>;

/* -------------------------------------------------------------------------- */
/*                                Health Check                                */
/* -------------------------------------------------------------------------- */
export const healthCheckParamsSchema = z.object({
  publicId: z
    .string()
    .regex(/^\d+$/, "publicId must be a number")
    .transform(Number),
});
export type healthCheckParamsSchemaType = z.infer<
  typeof healthCheckParamsSchema
>;

export const healthCheckReplyBody = z.object({
  alive: z.boolean(),
});
export type healthCheckReplyBodyType = z.infer<typeof healthCheckReplyBody>;
/* -------------------------------------------------------------------------- */
/*                                Create Server                               */
/* -------------------------------------------------------------------------- */
export const createServerRequestBody = z.object({
  publicId: z.number().min(1, "Public ID must be at least 1"),
  name: z.string().min(1, "Name cannot be empty"),
  server_endpoint: z
    .string()
    .regex(
      /^(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]):(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)$/,
      "Invalid IP:PORT address format",
    ),
  // Only IP -> /^(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])$/,

  // Resources
  cpus: z.number().min(1, "CPUs must be at least 1"),
  vcpus: z.number().min(1, "vCPUs must be at least 1"),
  memory_mb: z.number().min(128, "Memory must be at least 128 MB"),
  disk: z.number().min(1, "Disk must be at least 1 GB"),
  in_link_mbps: z.number().min(1, "In Link must be at least 1 Mbps"),
  out_link_mbps: z.number().min(1, "Out Link must be at least 1 Mbps"),
  // Maximum to be used
  vcpus_max: z.number().min(1, "vCPUs Max must be at least 1"),
  memory_mb_max: z.number().min(128, "Memory Max must be at least 128 MB"),
  disk_max: z.number().min(1, "Disk Max must be at least 1 GB"),
});

export type createServerRequestBodyType = z.infer<
  typeof createServerRequestBody
>;

export const createServerReplyBody = z.object({
  message: z.string(),
});

export type createServerReplyBodyType = z.infer<typeof createServerReplyBody>;
