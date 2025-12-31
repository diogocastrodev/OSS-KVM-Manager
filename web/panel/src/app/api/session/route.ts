// app/api/session/route.ts
import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function forwardSetCookies(from: Response, to: NextResponse) {
  const h: any = from.headers;
  const list: string[] = h.getSetCookie?.() ?? [];
  if (list.length) {
    for (const c of list) to.headers.append("set-cookie", c);
  } else {
    const single = from.headers.get("set-cookie");
    if (single) to.headers.append("set-cookie", single);
  }
}

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";

  // 1) try session
  let res = await fetch(`${API}/api/v1/user/session`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (res.status !== 401) {
    const data = await res.json().catch(() => ({ user: null }));
    return NextResponse.json(data, { status: 200 });
  }

  // 2) refresh (IMPORTANT: forward cookie header!)
  const refreshRes = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (!refreshRes.ok) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  // 3) send cookies back to browser so it updates refresh_token/access_token
  const out = NextResponse.json({ user: null }, { status: 200 });
  forwardSetCookies(refreshRes, out);
  return out;
}
