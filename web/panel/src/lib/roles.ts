import { Role } from "@/types/Session";

export const roleRank: Record<Role, number> = {
  admin: 999,
  user: 1,
};

export function hasAtLeast(role: Role | undefined, min: Role) {
  if (!role) return false;
  return roleRank[role] >= roleRank[min];
}
