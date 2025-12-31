import { useCsrfStore } from "@/stores/csrf";
import { fetchCsrfToken } from "@/lib/csrf";

const API = process.env.NEXT_PUBLIC_API_URL!;

function isMutation(method?: string) {
  const m = (method ?? "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const doFetch = async () => {
    const headers = new Headers(init.headers);

    // Attach CSRF for mutations if present
    if (isMutation(init.method)) {
      let csrf = useCsrfStore.getState().token;
      if (!csrf) csrf = await fetchCsrfToken(); // best effort
      if (csrf) headers.set("x-csrf-token", csrf);
    }

    return fetch(`${API}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  };

  let res = await doFetch();
  if (res.status !== 401) return res;

  // Try refresh once
  const refreshRes = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  if (!refreshRes.ok) return res;

  // Refresh might return a new CSRF token too (cookie + body)
  // We can optionally re-fetch csrf token after refresh:
  await fetchCsrfToken();

  // Retry once
  res = await doFetch();
  return res;
}
