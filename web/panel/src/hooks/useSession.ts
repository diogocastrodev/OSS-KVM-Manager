import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { Session } from "@/types/Session";

export async function fetchSession(): Promise<Session | null> {
  const res = await apiFetch("/api/v1/user/session", { method: "GET" });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");

  const data = await res.json().catch(() => null);
  // Support multiple shapes (adjust to your backend response)
  return data?.user ?? data ?? null;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}
