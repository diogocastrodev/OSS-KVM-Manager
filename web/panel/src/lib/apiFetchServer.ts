import "server-only";
import { headers, cookies } from "next/headers";

const API = process.env.API_URL!;

function mergeCookieHeader(cookieHeader: string, setCookies: string[]) {
  const jar = new Map<string, string>();

  // Cookie header: "a=1; b=2"
  for (const part of (cookieHeader || "").split(/;\s*/)) {
    if (!part) continue;
    const [k, ...rest] = part.split("=");
    jar.set(k, rest.join("="));
  }

  // Set-Cookie: "access=NEW; Path=/; HttpOnly; ..."
  for (const sc of setCookies) {
    const [nv] = sc.split(";", 1);
    const [k, ...rest] = nv.split("=");
    jar.set(k.trim(), rest.join("="));
  }

  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function getSetCookies(res: Response): string[] {
  // Modern runtimes support getSetCookie() for multiple Set-Cookie headers. :contentReference[oaicite:1]{index=1}
  // Fallback: single header (may be incomplete if multiple cookies are set).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyHeaders = res.headers as any;
  if (typeof anyHeaders.getSetCookie === "function")
    return anyHeaders.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

export async function apiFetchServer(path: string, init: RequestInit = {}) {
  const h = await headers();
  const baseCookie = h.get("cookie") ?? "";

  const doFetch = (cookieHeader: string) =>
    fetch(`${API}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        cookie: cookieHeader, // IMPORTANT: server-side must forward cookies manually
      },
      cache: "no-store",
    });

  let res = await doFetch(baseCookie);
  if (res.status !== 401) return res;

  // refresh
  const refreshRes = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { cookie: baseCookie },
    cache: "no-store",
  });

  if (!refreshRes.ok) return res;

  const setCookies = getSetCookies(refreshRes);
  const newCookie = mergeCookieHeader(baseCookie, setCookies);

  // retry with updated cookie *for this server request*
  res = await doFetch(newCookie);
  return res;
}

/**
 * Use this only for "GET" requests from the server side to the API.
 * * It does not support Refresh Tokens.
 * * It does not support CSRF Tokens.
 * @param path API Path
 * @param init Optional: request stuff
 * @returns JSON Data or Error Unauthorized
 */
export async function apiFetchServerOld(path: string, init: RequestInit = {}) {
  const token = (await cookies()).get("access_token")?.value;

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
