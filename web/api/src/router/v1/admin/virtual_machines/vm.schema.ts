import { z } from "zod";
/* -------------------------------------------------------------------------- */
/*                               Get all Servers                              */
/* -------------------------------------------------------------------------- */
export const adminGetAllServersReplySchema = z.object({
  servers: z.array(
    z.object({
      publicId: z.string(),
      name: z.string(),
      status: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});
/* -------------------------------------------------------------------------- */
/*                              Get VM By ID                              */
/* -------------------------------------------------------------------------- */
export const adminGetVirtualMachineByIdParamsSchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "vmPublicId must be a number")
    .transform(Number),
});

export type AdminGetVirtualMachineByIdParams = z.infer<
  typeof adminGetVirtualMachineByIdParamsSchema
>;

export const adminGetVirtualMachineByIdReplySchema = z.object({
  publicId: z.int(),
  name: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminGetVirtualMachineByIdReply = z.infer<
  typeof adminGetVirtualMachineByIdReplySchema
>;
/* -------------------------------------------------------------------------- */
/*                           Create Virtual machine                           */
/* -------------------------------------------------------------------------- */
export const adminCreateVirtualMachineBodySchema = z.object({
  serverPublicId: z.int().min(1),
  publicId: z.int().min(1),
  name: z.string().min(3).max(50),
  vcpus: z.number().min(1).max(256),
  memory_mib: z
    .number()
    .min(1)
    .max(256 * 1024),
  disk_gb: z.number().min(1).max(2000),
  network: z.object({
    in_avg_mbps: z.number().min(0),
    in_peak_mbps: z.number().min(0),
    in_burst_mbps: z.number().min(0),
    out_avg_mbps: z.number().min(0),
    out_peak_mbps: z.number().min(0),
    out_burst_mbps: z.number().min(0),
  }),
  host: z
    .object({
      hostname: z.string().min(1).max(100),
      username: z.string().min(1).max(100),
      password: z.string().min(1).max(100).optional(),
      public_key: z.string().min(1).max(5000).optional(),
    })
    .optional(),
  ip_local: z.ipv4(),
  ip_public: z.ipv4().optional(),
  dns_servers: z.array(z.string().ipv4()).optional(),
  os: z.string().min(1).max(100).optional(),
});

export type AdminCreateVirtualMachineBody = z.infer<
  typeof adminCreateVirtualMachineBodySchema
>;

export const adminCreateVirtualMachineReplySchema = z.object({
  publicId: z.int(),
  name: z.string(),
});

export type AdminCreateVirtualMachineReply = z.infer<
  typeof adminCreateVirtualMachineReplySchema
>;
/* -------------------------------------------------------------------------- */
/*                                Update Server                               */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                Delete Server                               */
/* -------------------------------------------------------------------------- */
export const AdminDeleteVirtualMachineParamsSchema = z.object({
  vmPublicId: z
    .string()
    .regex(/^\d+$/, "publicId must be a number")
    .transform(Number),
});

export type AdminDeleteVirtualMachineParams = z.infer<
  typeof AdminDeleteVirtualMachineParamsSchema
>;

export const AdminDeleteVirtualMachineReplySchema = z.object({
  message: z.string(),
});

export type AdminDeleteVirtualMachineReply = z.infer<
  typeof AdminDeleteVirtualMachineReplySchema
>;
