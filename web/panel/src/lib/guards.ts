import { Role, Session } from "@/types/Session";

export const isGuest = (s?: Session) => !s?.user;
export const isAuthed = (s?: Session) => !!s?.user;

export const hasGlobalRole = (s: Session | undefined, allowed: Role[]) => {
  const role = s?.user?.role;
  return !!role && allowed.includes(role);
};

export const isAdmin = (s?: Session) => hasGlobalRole(s, ["admin"]);
