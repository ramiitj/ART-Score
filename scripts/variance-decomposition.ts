// Ad-hoc analysis tool: reads an attempts export (the shape returned by
// GET /api/admin/attempts) and reports the person x item variance
// decomposition described in docs/HEADROOM_MIGRATION_SPEC.md §11 and §15.
//
// Usage:
//   npx tsx scripts/variance-decomposition.ts path/to/attempts-export.json
//
// The export file must be a JSON array of attempt records, or an object of
// the form { attempts: [...] }.

import { readFileSync } from "fs";
import { decomposeVariance } from "../server/headroom/varianceDecomposition";
import type { VarianceDecompositionRecord } from "../server/headroom/varianceDecomposition";

function loadAttempts(filePath: string): any[] {
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.attempts)) return raw.attempts;
  throw new Error("Expected a JSON array of attempts, or { attempts: [...] }.");
}

function toRecords(attempts: any[]): VarianceDecompositionRecord[] {
  const records: VarianceDecompositionRecord[] = [];
  for (const a of attempts) {
    if (a?.comparable !== true) continue;
    const score = a?.evaluation?.score ?? a?.score;
    if (typeof score !== "number" || Number.isNaN(score)) continue;

    const personKey: string | undefined = a.userEmail || a.anonymizedUserId;
    const itemKey: string | undefined = a.domain && a.difficulty ? `${a.domain}::${a.difficulty}` : undefined;
    if (!personKey || !itemKey) continue;

    records.push({ personKey, itemKey, value: score });
  }
  return records;
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/variance-decomposition.ts <attempts-export.json>");
    process.exit(1);
  }

  const attempts = loadAttempts(filePath);
  const records = toRecords(attempts);
  const result = decomposeVariance(records);

  console.log("=== Person x Item Variance Decomposition ===");
  console.log(`Comparable attempts analyzed: ${result.totalN} (of ${attempts.length} in export)`);
  console.log(`Unique persons: ${result.uniquePersons}`);
  console.log(`Unique items (domain x difficulty): ${result.uniqueItems}`);
  console.log(`Persons with 2+ attempts: ${result.personsWithRepeatedAttempts}`);
  console.log("");
  console.log(`Person variance share: ${(result.personVariance.varianceShare * 100).toFixed(1)}%`);
  console.log(`Item variance share:   ${(result.itemVariance.varianceShare * 100).toFixed(1)}%`);
  console.log("");

  if (!result.sufficientRepeatedMeasures) {
    console.log(
      "WARNING: Too few persons have repeated attempts across different items " +
      `(${result.personsWithRepeatedAttempts}, want >= 20) for the person-variance ` +
      "share above to be trustworthy. With mostly one attempt per person, 'person " +
      "variance' is confounded with single-item noise and cannot be distinguished " +
      "from it. This is exactly the limitation multi-item sessions (migration " +
      "Phase 4b) are meant to fix -- treat the shares above as illustrative only " +
      "until then."
    );
  } else {
    console.log(
      "Repeated-measures sample size is sufficient for this decomposition to be a " +
      "meaningful first read. Per the migration spec's falsification condition: a " +
      "high item share and near-zero person share would indicate the instrument is " +
      "measuring item difficulty, not a human capacity."
    );
  }
}

main();
