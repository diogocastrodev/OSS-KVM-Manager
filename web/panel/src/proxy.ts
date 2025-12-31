// src/proxy.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL!;
const handleI18nRouting = createMiddleware(routing);

// Rules (WITHOUT locale prefix)
const GUEST_ONLY: string[] = ["/", "/register"];
const PROTECTED_PREFIXES: string[] = ["/panel", "/profile"];
const ADMIN_ONLY_PREFIXES: string[] = ["/panel/admin", "/panel/users"];

const LOGIN_PATH = "/";
const DEFAULT_AUTHED_PATH = "/panel";

function matchesAnyPrefix(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}
function isGuestOnly(path: string) {
  return matchesAnyPrefix(path, GUEST_ONLY);
}
function isProtected(path: string) {
  return (
    matchesAnyPrefix(path, PROTECTED_PREFIXES) ||
    matchesAnyPrefix(path, ADMIN_ONLY_PREFIXES)
  );
}
function isAdminOnly(path: string) {
  return matchesAnyPrefix(path, ADMIN_ONLY_PREFIXES);
}

function parseLocaleAndAppPath(pathname: string) {
  // pathname like "/en/panel" -> locale="en", appPath="/panel"
  const parts = pathname.split("/").filter(Boolean);
  const maybeLocale = parts[0];
  const locale = routing.locales.includes(maybeLocale as any)
    ? maybeLocale
    : routing.defaultLocale;

  const appPath =
    "/" +
    (routing.locales.includes(maybeLocale as any)
      ? parts.slice(1).join("/")
      : parts.join("/"));
  return {
    locale,
    appPath: appPath === "/" ? "/" : appPath.replace(/\/+$/, ""),
  };
}

function withLocale(locale: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${p}`;
}

async function backendSession(cookieHeader: string) {
  const res = await fetch(`${API}/api/v1/user/session`, {
    method: "GET",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (res.status === 401) return null;
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  return data?.user ?? data ?? null; // adjust if your shape differs
}

async function backendRefresh(cookieHeader: string, req: NextRequest) {
  const res = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      cookie: cookieHeader,
      "user-agent": req.headers.get("user-agent") ?? "",
      "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  // Safest way if available (multiple Set-Cookie headers)
  const getSetCookie = (res.headers as any).getSetCookie?.bind(res.headers);
  const setCookies: string[] =
    (getSetCookie ? getSetCookie() : null) ??
    (res.headers.get("set-cookie")
      ? [res.headers.get("set-cookie") as string]
      : []);

  return { setCookies };
}

function parseSetCookiePairs(setCookies: string[]) {
  const out: Record<string, string> = {};
  for (const sc of setCookies) {
    const firstPart = sc.split(";")[0];
    const eq = firstPart.indexOf("=");
    if (eq === -1) continue;
    const name = firstPart.slice(0, eq).trim();
    const value = firstPart.slice(eq + 1).trim();
    out[name] = value;
  }
  return out;
}

function mergeCookieHeader(original: string, updates: Record<string, string>) {
  const map: Record<string, string> = {};
  original
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const eq = pair.indexOf("=");
      if (eq === -1) return;
      map[pair.slice(0, eq)] = pair.slice(eq + 1);
    });

  for (const [k, v] of Object.entries(updates)) map[k] = v;

  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export default async function proxy(req: NextRequest) {
  // 1) Let next-intl do locale negotiation/redirects/rewrites first
  let response = handleI18nRouting(req);

  // If next-intl is redirecting or erroring, stop here.
  // (Response.ok is only true for 2xx; redirects are not ok)
  if (!response.ok) return response;

  // Resolve the effective URL after i18n rewrites (if any)
  const effectiveUrl = new URL(
    response.headers.get("x-middleware-rewrite") || req.url
  );
  const { locale, appPath } = parseLocaleAndAppPath(effectiveUrl.pathname);

  const cookieHeader = req.headers.get("cookie") ?? "";

  // 2) Verify session with backend
  let user = await backendSession(cookieHeader);

  // 3) If not authenticated but route depends on auth state, try refresh then re-check session
  if (!user && (isProtected(appPath) || isGuestOnly(appPath))) {
    const refreshed = await backendRefresh(cookieHeader, req);

    if (refreshed?.setCookies?.length) {
      // Attach new cookies to the outgoing response (so browser receives them)
      for (const c of refreshed.setCookies)
        response.headers.append("set-cookie", c);

      // Confirm refresh really worked by re-checking session using merged cookies
      const updates = parseSetCookiePairs(refreshed.setCookies);
      const mergedCookieHeader = mergeCookieHeader(cookieHeader, updates);
      user = await backendSession(mergedCookieHeader);
    }
  }

  // Helper to create redirects that keep i18n headers/cookies
  const redirectWithI18nHeaders = (to: string) =>
    NextResponse.redirect(new URL(to, req.url), { headers: response.headers });

  // 4) Route decisions
  if (user) {
    // guest-only -> go to panel
    if (isGuestOnly(appPath)) {
      return redirectWithI18nHeaders(withLocale(locale, DEFAULT_AUTHED_PATH));
    }

    // admin-only check
    if (isAdminOnly(appPath)) {
      const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
      if (!roles.includes("admin")) {
        return redirectWithI18nHeaders(withLocale(locale, DEFAULT_AUTHED_PATH));
      }
    }

    return response; // allow request (with any cookies appended)
  }

  // not logged in
  if (isProtected(appPath)) {
    return redirectWithI18nHeaders(withLocale(locale, LOGIN_PATH));
  }

  return response;
}

export const config = {
  // Keep your matcher; next-intl recommends excluding api/_next/etc.
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
