import { Role } from "@/types/Session";

export const roleRank: Record<Role, number> = {
  ADMIN: 999,
  USER: 1,
};

export function hasAtLeast(role: Role | undefined, min: Role) {
  if (!role) return false;
  return roleRank[role] >= roleRank[min];
}
