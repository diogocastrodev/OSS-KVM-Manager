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

export enum VirtualMachineUserRole {
  VIEWER = "VIEWER",
  OPERATOR = "OPERATOR",
  OWNER = "OWNER",
}

export interface DatabaseUserSchema {
  id: Generated<string>;
  name: string | null;
  email: string;
  password: string;
  role: Generated<UserRole>;
  status: Generated<UserStatus>;
  emailVerified: Generated<boolean>;
  emailVerificationToken: string | null;
  deactivationReason: UserDeactivationReason | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface DatabaseRefreshTokenSchema {
  id: Generated<string>;
  token: string;
  expiresAt: Date;
  userId: string;
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
  ipPublic: string | null;
  vcpus_max: number;
  ram_max: number;
  disk_max: number;
  vcpus_available: number;
  ram_available: number;
  disk_available: number;
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
  ipPublic: string | null;
  os: string | null;
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

// Database Schema
export interface DatabaseSchema {
  users: DatabaseUserSchema;
  refresh_tokens: DatabaseRefreshTokenSchema;
  servers: DatabaseServerSchema;
  virtual_machines: DatabaseVirtualMachineSchema;
  virtual_machines_users: DatabaseVirtualMachineUserSchema;
}

// Combined Database Schema
export type DatabaseSchemaType = DatabaseSchema & DatabaseSchemaViews;
