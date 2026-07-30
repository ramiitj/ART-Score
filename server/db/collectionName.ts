// Firestore collection naming, namespaced by an optional deployment prefix.
//
// Two deployments (e.g. the original ART-Score and artscore1) can share one
// Firebase project without their data intermingling: each sets a distinct
// FIRESTORE_COLLECTION_PREFIX and writes to its own set of collections.
//
// This matters beyond tidiness. Attempts scored by the pre-migration
// instrument carry `comparable: true` computed under the old rules, so a
// shared `attempts` collection would let the leaderboard and percentile rank
// scores from two different instruments against each other, with no stored
// flag able to tell them apart after the fact.
//
// An unset or empty prefix preserves the original, unprefixed names exactly,
// so an existing deployment keeps reading and writing the data it already has.

export const COLLECTIONS = [
  "sessions",
  "attempts",
  "testRuns",
  "rubricVersions",
  "adminAuditLog"
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

// Firestore collection IDs may not contain "/", may not be "." or "..", and
// may not match __.*__ (that pattern is reserved). A prefix that violates
// these would produce an invalid path or silently address a reserved
// collection, so it is rejected at startup rather than at first write.
export function validateCollectionPrefix(prefix: string): void {
  if (prefix === "") return;

  if (prefix.includes("/")) {
    throw new Error(`FIRESTORE_COLLECTION_PREFIX must not contain "/" (got: ${JSON.stringify(prefix)}).`);
  }
  if (prefix === "." || prefix === "..") {
    throw new Error(`FIRESTORE_COLLECTION_PREFIX must not be "." or ".." (got: ${JSON.stringify(prefix)}).`);
  }
  if (/^__.*__$/.test(prefix)) {
    throw new Error(`FIRESTORE_COLLECTION_PREFIX must not match __*__, which Firestore reserves (got: ${JSON.stringify(prefix)}).`);
  }
  // Every resulting name must stay inside Firestore's 1500-byte ID limit.
  const longest = COLLECTIONS.reduce((a, b) => (a.length >= b.length ? a : b));
  if (Buffer.byteLength(prefix + longest, "utf8") > 1500) {
    throw new Error("FIRESTORE_COLLECTION_PREFIX is too long; collection IDs are limited to 1500 bytes.");
  }
}

export function buildCollectionName(base: CollectionName, prefix: string | undefined | null): string {
  return `${prefix ?? ""}${base}`;
}
