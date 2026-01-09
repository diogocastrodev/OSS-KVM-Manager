import type { Generated } from "kysely";

// Database Views
export type DatabaseSchemaViews = {
  meow: Readonly<{
    id: string;
  }>;
};

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  DEACTIVATED = "DEACTIVATED",
}

export enum UserDeactivationReason {
  USER_REQUEST = "USER_REQUEST",
  TERMS_OF_SERVICE_VIOLATION = "TERMS_OF_SERVICE_VIOLATION",
  OTHER = "OTHER",
}

export enum ServerStatus {
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  DISABLED = "DISABLED",
}

export enum VirtualMachineUserRole {
  VIEWER = "VIEWER",
  OPERATOR = "OPERATOR",
  OWNER = "OWNER",
}

export enum VirtualMachineStatus {
  CREATING = "CREATING",
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  SUSPENDED = "SUSPENDED",
  FORMATTING = "FORMATTING",
  DELETING = "DELETING",
  FAILED = "FAILED",
  OPERATIONAL = "OPERATIONAL",
}

export enum IsoStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
export enum IsoVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}
export enum IsoArch {
  X86_64 = "X86_64",
  ARM64 = "ARM64",
}
export enum IsoType {
  LIVE = "LIVE",
  CLOUD_IMAGE = "CLOUD_IMAGE",
}

export interface DatabaseUserSchema {
  id: Generated<string>;
  name: string;
  email: string;
  password: string;
  role: Generated<UserRole>;
  status: Generated<UserStatus>;
  emailVerified: Generated<boolean>;
  emailVerificationToken: string | null;
  deactivationReason: UserDeactivationReason | null;
  authz_version: Generated<number>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface DatabaseRefreshTokenSchema {
  id: Generated<string>;
  token: string;
  expiresAt: Date;
  userId: string;
  platform: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface DatabaseServerSchema {
  id: Generated<string>;
  publicId: number;
  name: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  cpus: number;
  vcpus: number;
  ram: number;
  disk: number;
  in_link: number;
  out_link: number;
  ipLocal: string;
  agent_port: number;
  vms_network: Generated<string>;
  vms_network_mask: Generated<string>;
  vms_gateway: Generated<string>;
  vms_mac_prefix: Generated<string>;
  ipPublic: string | null;
  vcpus_max: number;
  ram_max: number;
  disk_max: number;
  vcpus_available: number;
  ram_available: number;
  disk_available: number;
  status: ServerStatus;
  public_key: string | null;
}

export interface DatabaseVirtualMachineSchema {
  id: Generated<string>;
  publicId: number;
  name: string;
  serverId: string;
  vcpus: number;
  ram: number;
  disk: number;
  in_avg: number;
  out_avg: number;
  in_peak: number;
  out_peak: number;
  in_burst: number;
  out_burst: number;
  ipLocal: string;
  mac: string;
  ipPublic: string | null;
  osId: string | null;
  status: Generated<VirtualMachineStatus>;
  errorMessage: string | null;
  format_started_at: Date | null;
  format_completed_at: Date | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface DatabaseVirtualMachineUserSchema {
  id: Generated<string>;
  virtualMachinesId: string | null;
  userId: string | null;
  role: Generated<VirtualMachineUserRole>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface DatabaseAuditLogSchema {
  id: Generated<string>;
  userId: string | null;
  action: string;
  details: string | null;
  createdAt: Generated<Date>;
}

export interface DatabaseIsosPathsSchema {
  id: Generated<string>;
  osId: string | null;
  path: string;
  status: Generated<IsoStatus>;
  visibility: Generated<IsoVisibility>;
  arch: Generated<IsoArch>;
  type: Generated<IsoType>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}
export interface DatabaseOperativeSystemsSchema {
  id: Generated<string>;
  os: string;
  version: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

// Database Schema
export interface DatabaseSchema {
  users: DatabaseUserSchema;
  refresh_tokens: DatabaseRefreshTokenSchema;
  servers: DatabaseServerSchema;
  virtual_machines: DatabaseVirtualMachineSchema;
  virtual_machines_users: DatabaseVirtualMachineUserSchema;
  audit_logs: DatabaseAuditLogSchema;
  isos_paths: DatabaseIsosPathsSchema;
  operative_systems: DatabaseOperativeSystemsSchema;
}

// Combined Database Schema
export type DatabaseSchemaType = DatabaseSchema & DatabaseSchemaViews;
