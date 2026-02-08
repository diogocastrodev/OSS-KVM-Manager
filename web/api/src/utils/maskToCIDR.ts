function netmaskToCidr(netmask: string): number {
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

export default netmaskToCidr;
