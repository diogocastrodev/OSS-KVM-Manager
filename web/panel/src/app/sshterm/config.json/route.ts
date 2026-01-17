import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get("sshterm_console_token")?.value;

  if (!token) {
    return NextResponse.json(
      { persist: false, endpoints: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Fastify WS endpoint
  const wsBase =
    process.env.NEXT_PUBLIC_FASTIFY_WS_BASE ?? "ws://localhost:8000";
  const wsUrl = `${wsBase}/api/v1/ws/sshterm?token=${encodeURIComponent(
    token
  )}`;

  return NextResponse.json(
    {
      persist: false,
      theme: "dark",
      endpoints: [{ name: "vm", url: wsUrl }],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
