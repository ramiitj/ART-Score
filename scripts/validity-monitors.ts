// Standing validity monitors (docs/HEADROOM_MIGRATION_SPEC.md §13), run
// on-demand against a historical attempts export until real traffic volume
// justifies a live/scheduled version of this same check.
//
// Elevation monitor: the ongoing rate at which the steered output beats the
// self-revised ceiling in blind paired comparison. If this drops to chance,
// the construct is empty.
//
// Obsolescence monitor: mean Headroom (shadow score) per executor model era.
// If a model upgrade collapses Headroom toward zero after a prior era showed
// real headroom, the instrument should record its own obsolescence rather
// than hide it.
//
// Usage:
//   npx tsx scripts/validity-monitors.ts path/to/attempts-export.json
//
// The export file must be a JSON array of attempt records (the shape
// returned by GET /api/admin/attempts), or an object of the form
// { attempts: [...] }.

import { readFileSync } from "fs";
import {
  computeElevationMonitor,
  computeObsolescenceMonitor,
  computeVerbosityLeakageMonitor,
  MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR,
  MIN_SAMPLE_SIZE_PER_ERA,
  MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR
} from "../server/headroom/validityMonitors";
import type { ModelEraRecord, LeakageMonitorRecord } from "../server/headroom/validityMonitors";

export function loadAttempts(filePath: string): any[] {
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.attempts)) return raw.attempts;
  throw new Error("Expected a JSON array of attempts, or { attempts: [...] }.");
}

export function toPSteeredValues(attempts: any[]): number[] {
  const values: number[] = [];
  for (const a of attempts) {
    if (a?.comparable !== true) continue;
    const pSteered = a?.headroomShadow?.pSteered;
    if (typeof pSteered === "number" && !Number.isNaN(pSteered)) values.push(pSteered);
  }
  return values;
}

export function toLeakageRecords(attempts: any[]): LeakageMonitorRecord[] {
  const records: LeakageMonitorRecord[] = [];
  for (const a of attempts) {
    if (a?.comparable !== true) continue;
    const resolution = a?.headroomShadow?.resolution;
    const editDistanceNorm = a?.editDistanceNorm;
    if (typeof resolution !== "number" || typeof editDistanceNorm !== "number") continue;
    records.push({ resolution, editDistanceNorm });
  }
  return records;
}

export function toModelEraRecords(attempts: any[]): ModelEraRecord[] {
  const records: ModelEraRecord[] = [];
  for (const a of attempts) {
    if (a?.comparable !== true) continue;
    const headroomScoreShadow = a?.headroomShadow?.headroomScoreShadow;
    const model = a?.executorModel;
    const timestamp = a?.timestamp;
    if (typeof headroomScoreShadow !== "number" || typeof model !== "string" || typeof timestamp !== "string") continue;
    records.push({ model, headroomScoreShadow, timestamp });
  }
  return records;
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/validity-monitors.ts <attempts-export.json>");
    process.exit(1);
  }

  const attempts = loadAttempts(filePath);

  const elevation = computeElevationMonitor(toPSteeredValues(attempts));
  console.log("=== Elevation Monitor ===");
  console.log(`Comparable attempts with a paired-comparison score: ${elevation.n}`);
  if (elevation.meanPSteered === null) {
    console.log("No data.");
  } else {
    console.log(`Mean P(steered beats self-revised ceiling): ${elevation.meanPSteered.toFixed(3)}`);
    if (!elevation.sufficientSample) {
      console.log(`WARNING: fewer than ${MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR} attempts -- not yet reliable.`);
    } else if (elevation.atOrNearChance) {
      console.log("ALERT: elevation rate is at or near chance (0.5) -- the construct may be empty. See docs/HEADROOM_MIGRATION_SPEC.md §13.");
    } else {
      console.log("Elevation rate is meaningfully above chance.");
    }
  }
  console.log("");

  const obsolescence = computeObsolescenceMonitor(toModelEraRecords(attempts));
  console.log("=== Obsolescence Monitor ===");
  if (obsolescence.eras.length === 0) {
    console.log("No data.");
  } else {
    for (const era of obsolescence.eras) {
      const flag = era.n < MIN_SAMPLE_SIZE_PER_ERA ? " (below minimum sample size)" : "";
      console.log(`${era.model}: n=${era.n}, mean headroom shadow=${era.meanHeadroomShadow.toFixed(3)}${flag}`);
    }
    console.log("");
    if (obsolescence.possibleObsolescence) {
      console.log("ALERT: the most recent sufficiently-sampled model era shows near-zero Headroom after an earlier era showed meaningful Headroom -- possible instrument obsolescence (continual learning solved). See docs/HEADROOM_MIGRATION_SPEC.md §13.");
    } else {
      console.log("No obsolescence signal detected.");
    }
  }
  console.log("");

  const leakage = computeVerbosityLeakageMonitor(toLeakageRecords(attempts));
  console.log("=== Verbosity-Leakage Monitor ===");
  console.log(`Attempts with both a Resolution and an edit-distance signal: ${leakage.n}`);
  if (leakage.correlation === null) {
    console.log("Correlation undefined (too few attempts, or no variance in edit magnitude).");
  } else {
    console.log(`Correlation (edit magnitude vs Resolution): ${leakage.correlation.toFixed(3)}`);
    if (!leakage.sufficientSample) {
      console.log(`WARNING: fewer than ${MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR} attempts -- not yet reliable.`);
    } else if (leakage.possibleLeakage) {
      console.log("ALERT: larger edits are strongly associated with higher Resolution. Resolution is meant to be independent of edit size, so this suggests the manifest-resolution judge may be rewarding volume rather than genuine gap closure. Investigate the judge, not the score formula. See docs/HEADROOM_MIGRATION_SPEC.md §13.");
    } else {
      console.log("No verbosity-leakage signal detected.");
    }
  }
}

// Only run when executed directly (npx tsx scripts/validity-monitors.ts),
// not when the exported helpers are imported for unit testing.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
