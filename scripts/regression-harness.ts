// Regression harness (docs/HEADROOM_MIGRATION_SPEC.md §15): replays a sample
// of historical attempts through both the legacy scorer and the new-
// architecture headroomShadow score (both already computed and stored on
// each attempt -- server.ts runs headroomShadow alongside the legacy score
// on every real evaluation, see server.ts's evaluate-revision handler) and
// reports the score-shift distribution between them. This is the report the
// spec requires be published before the Phase 4 cutover.
//
// Usage:
//   npx tsx scripts/regression-harness.ts path/to/attempts-export.json
//
// The export file must be a JSON array of attempt records (the shape
// returned by GET /api/admin/attempts), or an object of the form
// { attempts: [...] }.

import { readFileSync } from "fs";
import { computeScoreShiftReport } from "../server/headroom/scoreShiftReport";
import type { ScoreShiftRecord } from "../server/headroom/scoreShiftReport";

export function loadAttempts(filePath: string): any[] {
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.attempts)) return raw.attempts;
  throw new Error("Expected a JSON array of attempts, or { attempts: [...] }.");
}

// Only attempts with both a comparable legacy score and a computed
// headroomShadow can be compared -- headroomShadow is skipped whenever the
// session lacks a self-revised ceiling or gap manifest (server.ts), or the
// Judge v2 calls failed for that attempt.
export function toRecords(attempts: any[]): ScoreShiftRecord[] {
  const records: ScoreShiftRecord[] = [];
  for (const a of attempts) {
    if (a?.comparable !== true) continue;
    const oldScore = a?.evaluation?.score ?? a?.score;
    const shadow = a?.headroomShadow;
    if (typeof oldScore !== "number" || Number.isNaN(oldScore)) continue;
    if (!shadow || typeof shadow.headroomScoreShadow !== "number") continue;

    records.push({
      oldScore,
      newScoreShadow: shadow.headroomScoreShadow,
      validityGatePassed: shadow.validityGatePassed === true
    });
  }
  return records;
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/regression-harness.ts <attempts-export.json>");
    process.exit(1);
  }

  const attempts = loadAttempts(filePath);
  const records = toRecords(attempts);
  const report = computeScoreShiftReport(records);

  console.log("=== Regression Harness: Legacy Score vs Headroom Shadow Score ===");
  console.log(`Attempts analyzed: ${report.n} (of ${attempts.length} in export)`);
  console.log("");

  if (report.n === 0) {
    console.log("No attempts with both a comparable legacy score and a computed headroomShadow -- nothing to report.");
    return;
  }

  console.log(`Mean legacy score:        ${report.meanOldScore!.toFixed(2)}`);
  console.log(`Mean headroom shadow score (0-100 scale): ${report.meanNewScore!.toFixed(2)}`);
  console.log(`Mean shift (new - old):   ${report.meanDiff! >= 0 ? "+" : ""}${report.meanDiff!.toFixed(2)}`);
  console.log(`Correlation (old vs new): ${report.correlation === null ? "undefined (no variance)" : report.correlation.toFixed(3)}`);
  console.log("");
  console.log(`Validity gate passed: ${report.gatePassedCount} / ${report.n}`);
  console.log(`Validity gate failed (Headroom forced to 0): ${report.gateFailedCount} / ${report.n}`);
}

// Only run when executed directly (npx tsx scripts/regression-harness.ts),
// not when loadAttempts/toRecords are imported for unit testing.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
