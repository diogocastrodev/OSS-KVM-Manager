import { useCsrfStore } from "@/stores/csrf";
import { fetchCsrfToken } from "@/lib/csrf";

const API = process.env.NEXT_PUBLIC_API_URL!;

function isMutation(method?: string) {
  const m = (method ?? "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

// Single-flight refresh promise shared across calls
let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const doFetch = async () => {
    const headers = new Headers(init.headers);

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

  // Wait for the *single* refresh
  const ok = await refreshOnce();
  if (!ok) return res;

  // optional: refresh csrf after refresh
  await fetchCsrfToken();

  // Retry once
  return doFetch();
}
