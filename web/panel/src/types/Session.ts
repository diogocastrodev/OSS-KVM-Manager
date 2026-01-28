/**
 * User Session Roles
 */
export type Role = "ADMIN" | "USER";

/**
 * JWT Data Structure
 */
type JWTData = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * User Session Type
 */
export type Session = JWTData | null;
