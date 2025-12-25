import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function cookieHeaderFromStore(store: Awaited<ReturnType<typeof cookies>>) {
  // Serialize cookies into "name=value; name2=value2" format
  return store
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

export async function GET() {
  //  Get API URL from env
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    return NextResponse.json(
      { user: null, error: "missing_api_url" },
      { status: 200 }
    );
  }
  // Get cookies to forward
  const store = await cookies();
  const cookieHeader = cookieHeaderFromStore(store);

  try {
    // Fetch user from backend
    const res = await fetch(`${API_URL}/api/v1/user`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      credentials: "include",
      cache: "no-store",
    });

    // User is not authenticated
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Some other error
    if (!res.ok) {
      return NextResponse.json(
        { user: null, error: `backend_${res.status}` },
        { status: 200 }
      );
    }
    // Success
    const user = await res.json();
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    // Network or other error
    return NextResponse.json(
      { user: null, error: "backend_unreachable" },
      { status: 200 }
    );
  }
}
