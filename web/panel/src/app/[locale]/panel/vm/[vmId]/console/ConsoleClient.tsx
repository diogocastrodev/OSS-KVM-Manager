"use client";
import { apiFetch, getCsrfToken } from "@/lib/apiFetch";
import { useState } from "react";

interface Params {
  vmId: string;
}

export default function ConsoleClient({ params }: { params: Params }) {
  const [open, setOpen] = useState(false);

  async function openConsole() {
    const res = await apiFetch(`/api/v1/vms/${params.vmId}/console`, {
      method: "POST",
    }); // this is the CSRF-protected one (browser handles it)

    if (!res.ok) {
      alert(`Failed to open console: ${await res.text()}`);
      return;
    }

    // Store the token in cookie for sshterm to use
    const token = (await res.json()).token as string;

    await fetch("/api/sshterm/store-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    });

    setOpen(true);
  }
  return (
    <>
      <div className="flex flex-col h-full p-2">
        <div className="h-full border-2 border-(--color-logo) rounded-md overflow-hidden">
          {!open ? (
            <>
              <div className="h-full flex items-center justify-center">
                <button
                  className="bg-blue-300 text-zinc-800 dark:bg-blue-800 dark:text-zinc-100 py-2 px-3 rounded-md cursor-pointer"
                  onClick={openConsole}
                >
                  Open terminal
                </button>
              </div>
            </>
          ) : (
            <iframe
              src="/sshterm/index.html"
              style={{ width: "100%", height: "100%", border: 0 }}
              allow="clipboard-read; clipboard-write"
            />
          )}
        </div>
      </div>
    </>
  );
}
