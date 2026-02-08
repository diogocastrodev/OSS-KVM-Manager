export function netmaskToCidr(netmask: string): number {
  const parts = netmask.trim().split(".");
  if (parts.length !== 4) throw new Error("Invalid IPv4 netmask format");

  // Parse octets and build 32-bit unsigned mask
  let mask = 0 >>> 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) throw new Error("Invalid octet");
    const n = Number(p);
    if (n < 0 || n > 255) throw new Error("Octet out of range");
    mask = ((mask << 8) | n) >>> 0;
  }

  // Validate: contiguous 1s then 0s.
  // Property: mask has the form 111..1100..00 iff (~mask + 1) & ~mask === 0
  const inv = ~mask >>> 0;
  if (((inv + 1) & inv) !== 0) {
    throw new Error("Not a valid contiguous netmask");
  }

  // Count leading 1 bits
  let cidr = 0;
  for (let i = 31; i >= 0; i--) {
    if (((mask >>> i) & 1) === 1) cidr++;
    else break;
  }

  return cidr;
}

export function cidrToNetmask(prefix: number): string {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("CIDR prefix must be an integer from 0 to 32");
  }

  // Build 32-bit mask with `prefix` leading 1s
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

  // Convert to dotted decimal
  const a = (mask >>> 24) & 255;
  const b = (mask >>> 16) & 255;
  const c = (mask >>> 8) & 255;
  const d = mask & 255;

  return `${a}.${b}.${c}.${d}`;
}

type IPv4 = [number, number, number, number];

function parseIPv4(ip: string): IPv4 {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) throw new Error("Invalid IPv4 format");

  const nums = parts.map((p) => {
    if (!/^\d+$/.test(p)) throw new Error("Invalid octet");
    const n = Number(p);
    if (n < 0 || n > 255) throw new Error("Octet out of range");
    return n;
  });

  // Convert number[] -> tuple
  return [nums[0]!, nums[1]!, nums[2]!, nums[3]!];
}

export function calculateNetworkAddress(ip: string, netmask: string): string {
  netmaskToCidr(netmask); // validates contiguity too
  const ipParts = parseIPv4(ip);
  const maskParts = parseIPv4(netmask);

  return [
    ipParts[0] & maskParts[0],
    ipParts[1] & maskParts[1],
    ipParts[2] & maskParts[2],
    ipParts[3] & maskParts[3],
  ].join(".");
}
