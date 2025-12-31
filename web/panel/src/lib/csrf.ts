import { useCsrfStore } from "@/stores/csrf";

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchCsrfToken(): Promise<string | null> {
  const res = await fetch(`${API}/api/v1/csrf`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const token = data?.csrfToken ?? data?.token ?? null;

  useCsrfStore.getState().setToken(token);
  return token;
}
