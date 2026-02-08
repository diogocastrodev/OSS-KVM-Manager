function cidrToNetmask(prefix: number): string {
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

export default cidrToNetmask;
