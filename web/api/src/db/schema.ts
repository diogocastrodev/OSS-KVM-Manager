import type { Generated } from "kysely";

// Database Views
export type DatabaseSchemaViews = {
  meow: Readonly<{
    id: string;
  }>;
};

export interface DatabaseUserSchema {
  id: Generated<string>;
  name: string | null;
  email: string;
  password: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DatabaseRefreshTokenSchema {
  id: Generated<string>;
  token: string;
  expiresAt: Date;
  userId: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

// Database Schema
export interface DatabaseSchema {
  users: DatabaseUserSchema;
  refresh_tokens: DatabaseRefreshTokenSchema;
}

// Combined Database Schema
export type DatabaseSchemaType = DatabaseSchema & DatabaseSchemaViews;
