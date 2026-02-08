import { headers, cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get("sshterm_console_token")?.value;
  if (!token) {
    return NextResponse.json(
      { persist: false, endpoints: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const h = await headers();
  const host = h.get("host"); // e.g. localhost:3000 or yourdomain.com
  const proto = h.get("x-forwarded-proto") ?? "http";
  const wsProto = proto === "https" ? "wss" : "ws";

  const wsUrl = `${wsProto}://${host}/api/v1/ws/sshterm?token=${encodeURIComponent(token)}`;

  return NextResponse.json(
    { persist: false, theme: "dark", endpoints: [{ name: "vm", url: wsUrl }] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
