import { useQuery } from "@tanstack/react-query";

async function getSession() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/session`, {
    credentials: "include",
  });
  if (!res.ok) return { user: null, error: `http_${res.status}` };
  return (await res.json()) as { user: any | null };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 15 * 1000, // tune
    refetchOnWindowFocus: true, // optional
  });
}
