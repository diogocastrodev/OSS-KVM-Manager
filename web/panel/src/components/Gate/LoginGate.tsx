"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !data?.email) {
      router.replace("/");
    }
  }, [isLoading, data?.email, router]);

  if (isLoading) return <></>;
  if (!data?.email) return <></>;

  return <>{children}</>;
}
