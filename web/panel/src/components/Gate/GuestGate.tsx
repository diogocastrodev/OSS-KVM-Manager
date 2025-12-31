"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export default function GuestGate({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const router = useRouter();

  if (!data) return null;
  const roles = data.role! ?? [];
  if (!roles.includes("admin")) return null;

  return <>{children}</>;
}
