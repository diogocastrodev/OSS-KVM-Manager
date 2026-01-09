import db from "@/db/database";

const runningJobs = new Map<string, NodeJS.Timeout>();

function jobKey(agentBaseUrl: string, vmId: string) {
  return `${agentBaseUrl}:${vmId}`;
}

export async function pollFinalizeUntilOperational(
  agentBaseUrl: string,
  vmId: string
) {
  const key = jobKey(agentBaseUrl, vmId);
  if (runningJobs.has(key)) return;

  const startedAt = Date.now();
  const timeoutMs = 10 * 60_000;

  let delayMs = 15_000; // ignore first 15s

  const tick = async () => {
    try {
      if (Date.now() - startedAt > timeoutMs) {
        await db
          .updateTable("virtual_machines")
          .set({ status: "FAILED", errorMessage: "Finalize timed out" })
          .where("id", "=", vmId)
          .execute();

        const t = runningJobs.get(key);
        if (t) clearTimeout(t);
        runningJobs.delete(key);
        return;
      }

      const res = await fetch(`${agentBaseUrl}/api/v1/vms/${vmId}/finalize`, {
        method: "POST",
      });

      if (res.status === 200) {
        await db
          .updateTable("virtual_machines")
          .set({ status: "OPERATIONAL", format_completed_at: new Date() })
          .where("id", "=", vmId)
          .execute();

        const t = runningJobs.get(key);
        if (t) clearTimeout(t);
        runningJobs.delete(key);
        return;
      }

      if (res.status !== 409) {
        const text = await res.text().catch(() => "");
        await db
          .updateTable("virtual_machines")
          .set({
            status: "FAILED",
            errorMessage: `Finalize failed ${res.status}: ${text}`,
          })
          .where("id", "=", vmId)
          .execute();

        const t = runningJobs.get(key);
        if (t) clearTimeout(t);
        runningJobs.delete(key);
        return;
      }

      // after the first run, poll every 5s
      delayMs = 5000;
      const t = setTimeout(tick, delayMs);
      runningJobs.set(key, t);
    } catch (e: any) {
      await db
        .updateTable("virtual_machines")
        .set({ status: "FAILED", errorMessage: e?.message ?? String(e) })
        .where("id", "=", vmId)
        .execute();

      const t = runningJobs.get(key);
      if (t) clearTimeout(t);
      runningJobs.delete(key);
    }
  };

  // schedule first attempt after 15s
  const t = setTimeout(tick, delayMs);
  runningJobs.set(key, t);
}
