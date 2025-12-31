export type Role = "admin" | "user";

type JWTData = {
  sub: string;
  email: string;
  name?: string;
  role: Role;
};

export type Session = JWTData | null;
