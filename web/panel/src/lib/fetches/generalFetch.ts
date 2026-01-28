import { apiFetch } from "../apiFetch";
import { apiFetchServer } from "../apiFetchServer";

type ServerClient = "server" | "client";

interface GeneralFetchOptions {
  clientType?: ServerClient;
  path: string;
}

async function generalFetch<T>({
  path,
  clientType = "client",
}: GeneralFetchOptions): Promise<T> {
  if (clientType === "server") {
    const res = await apiFetchServer(path);
    if (!res.ok) {
      console.log("Server fetch failed:", res.status, res.statusText);
      return null as unknown as T;
    }
    return res.json() as Promise<T>;
  } else {
    const res = await apiFetch(path);
    if (!res) {
      console.log("Client fetch failed: no response");
      return null as unknown as T;
    }
    if (!res.ok) {
      console.log("Client fetch failed:", res.status, res.statusText);
      return null as unknown as T;
    }
    return res.json() as Promise<T>;
  }
}

export default generalFetch;
