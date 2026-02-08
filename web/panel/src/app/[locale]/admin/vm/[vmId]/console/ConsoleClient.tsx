"use client";
import Tooltip from "@/components/ToolTip/ToolTip";
import VMNavbar from "@/components/vm/navbar/navbar";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useState } from "react";

interface Params {
  vmId: string;
}

interface props {
  translations: {
    openConsole: string;
    tip: {
      text: string;
      command: string;
    };
  };
}

interface Response {
  name: string;
}

export default function ConsoleClient({
  params,
  props,
}: {
  params: Params;
  props: props;
}) {
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
      <div className="flex flex-col h-full gap-y-2">
        <div className="flex flex-row">
          <div className="ml-auto">
            <Tooltip
              content={
                <>
                  {props.translations.tip.text}
                  <code className="px-1">
                    <span>
                      {props.translations.tip.command.split(" ")[0]}{" "}
                      <i>
                        {
                          props.translations.tip.command
                            .split(" ")[1]
                            .split("@")[0]
                        }
                      </i>
                      {"@"}
                      {
                        props.translations.tip.command
                          .split(" ")[1]
                          .split("@")[1]
                      }
                    </span>
                  </code>
                </>
              }
              delay={200}
              direction="left"
            >
              <InfoIcon className="inline-block mr-2" />
            </Tooltip>
          </div>
        </div>
        <div className="h-full border-2 border-(--color-logo) rounded-md overflow-hidden">
          {!open ? (
            <>
              <div className="h-full flex items-center justify-center">
                <button
                  className="bg-blue-300 text-zinc-800 dark:bg-blue-800 dark:text-zinc-100 py-2 px-3 rounded-md cursor-pointer"
                  onClick={openConsole}
                >
                  {props.translations.openConsole}
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
