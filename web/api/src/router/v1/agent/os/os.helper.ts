import path from "node:path";
import fsp from "node:fs/promises";
import fs from "node:fs";
import crypto from "node:crypto";

interface OSImageMeta {
  filename: string;
  type: "cloud" | "iso";
  sha256?: string;
  bytes?: number;
  mtimeMs?: number;
}

const IMAGES_DIR = path.resolve(
  process.env.OS_IMAGE_DIR ?? path.join(process.cwd(), "isos")
);

function assertSafeId(osId: string) {
  // avoid traversal + weird IDs
  if (!/^[a-zA-Z0-9._-]+$/.test(osId)) {
    throw new Error("Invalid osId");
  }
}

export function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fsp.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonAtomic(
  filePath: string,
  data: unknown
): Promise<void> {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp`);
  const raw = JSON.stringify(data, null, 2) + "\n";
  await fsp.writeFile(tmp, raw, "utf8");
  await fsp.rename(tmp, filePath);
}

async function acquireLock(lockPath: string, timeoutMs = 300_000) {
  const start = Date.now();
  while (true) {
    try {
      const fh = await fsp.open(lockPath, "wx");
      await fh.close();
      return;
    } catch (e: any) {
      if (e?.code !== "EEXIST") throw e;
      if (Date.now() - start > timeoutMs)
        throw new Error(`Timeout waiting for lock ${lockPath}`);
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

async function releaseLock(lockPath: string) {
  try {
    await fsp.unlink(lockPath);
  } catch {}
}

export async function resolveImageByName(osId: string): Promise<{
  dir: string;
  metaPath: string;
  meta: OSImageMeta;
  filePath: string;
}> {
  assertSafeId(osId);

  const dir = path.resolve(IMAGES_DIR, osId);
  const metaPath = path.join(dir, "meta.json");

  console.log("[os-repo] IMAGES_DIR =", IMAGES_DIR);
  console.log("[os-repo] osId      =", osId);
  console.log("[os-repo] dir       =", dir);
  console.log("[os-repo] metaPath  =", metaPath);

  if (!dir.startsWith(IMAGES_DIR + path.sep)) {
    throw new Error("Invalid osId path");
  }
  let meta: OSImageMeta;
  const metaRaw = await fsp.readFile(metaPath, "utf8").catch(() => null);
  if (!metaRaw) {
    // Optional: show what exists in the dir (very helpful)
    const listing = await fsp.readdir(dir).catch(() => []);
    meta = await createMetaIfMissing(dir, metaPath, osId);

    console.log("[os-repo] dir listing:", listing);
    throw new Error(`meta.json not found for ${osId} at ${metaPath}`);
  } else {
    meta = JSON.parse(metaRaw) as OSImageMeta;
  }

  const filePath = path.resolve(dir, meta.filename);
  console.log("[os-repo] filePath  =", filePath);

  if (!filePath.startsWith(dir + path.sep)) {
    throw new Error("Invalid filename in meta.json");
  }

  return { dir, metaPath, meta, filePath };
}

export async function ensureSha256InMeta(
  metaPath: string,
  filePath: string
): Promise<string> {
  const lockPath = metaPath + ".lock";
  await acquireLock(lockPath);
  try {
    const meta = await readJson<OSImageMeta>(metaPath);
    const stat = await fsp.stat(filePath);

    // If we already have sha + file hasn't changed, reuse it
    if (
      meta.sha256 &&
      meta.sha256.length === 64 &&
      meta.bytes === stat.size &&
      meta.mtimeMs === stat.mtimeMs
    ) {
      return meta.sha256;
    }

    const sha256 = await sha256File(filePath);
    meta.sha256 = sha256;
    meta.bytes = stat.size;
    meta.mtimeMs = stat.mtimeMs;

    await writeJsonAtomic(metaPath, meta);
    return sha256;
  } finally {
    await releaseLock(lockPath);
  }
}

async function createMetaIfMissing(
  dir: string,
  metaPath: string,
  osId: string
) {
  const entries = await fsp
    .readdir(dir, { withFileTypes: true })
    .catch(() => null);
  if (!entries) throw new Error(`Image directory not found for ${osId}`);

  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(qcow2|img|iso)$/i.test(n));

  if (files.length !== 1) {
    throw new Error(
      `meta.json missing for ${osId}. Found ${files.length} candidate image files (${files.join(", ")}).`
    );
  }

  const filename = files[0];
  if (!filename) {
    throw new Error(`No image file found in ${dir} for ${osId}`);
  }
  const type: "cloud" | "iso" = filename.toLowerCase().endsWith(".iso")
    ? "iso"
    : "cloud";

  const meta: OSImageMeta = { filename, type, sha256: "" };
  await writeJsonAtomic(metaPath, meta);
  return meta;
}
