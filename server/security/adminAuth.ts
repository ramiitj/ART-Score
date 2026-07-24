import crypto from "crypto";

// Splits a comma-separated ADMIN_KEYS env value into a clean list, trimming
// whitespace and dropping empties. Supports rotation: an operator can add a
// new key alongside the old one, migrate callers, then drop the old one --
// no downtime, no shared single static secret to juggle.
export function parseAdminKeys(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

function sha256(value: string): Buffer {
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

// Constant-time comparison against every valid key. Both sides are hashed to
// a fixed-length digest first: timingSafeEqual throws on length mismatches,
// and comparing raw keys of different lengths directly would itself leak
// timing information about key length.
export function isValidAdminKey(providedKey: string | undefined, validKeys: string[]): boolean {
  if (!providedKey || validKeys.length === 0) return false;

  const providedDigest = sha256(providedKey);
  let matched = false;
  for (const validKey of validKeys) {
    const validDigest = sha256(validKey);
    if (crypto.timingSafeEqual(providedDigest, validDigest)) {
      matched = true;
      // Deliberately do not break early -- keep constant-time behavior
      // across the whole key list regardless of where the match occurs.
    }
  }
  return matched;
}

// A short, non-reversible identifier for audit logs -- lets you tell which
// key was used across log entries without ever storing or logging the
// secret itself.
export function fingerprintAdminKey(key: string): string {
  return sha256(key).toString("hex").slice(0, 8);
}
