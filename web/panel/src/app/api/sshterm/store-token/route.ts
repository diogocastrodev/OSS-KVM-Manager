import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token) return new Response("Missing token", { status: 400 });

  (await cookies()).set({
    name: "sshterm_console_token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/sshterm",
    maxAge: 120,
  });

  return new Response(null, { status: 204 });
}
