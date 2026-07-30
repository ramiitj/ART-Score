import { describe, it, expect } from "vitest";
import {
  computeElevationMonitor,
  computeObsolescenceMonitor,
  computeVerbosityLeakageMonitor,
  MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR,
  MIN_SAMPLE_SIZE_PER_ERA,
  MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR
} from "../validityMonitors";
import type { ModelEraRecord, LeakageMonitorRecord } from "../validityMonitors";

describe("computeElevationMonitor", () => {
  it("returns an empty/null result for zero values", () => {
    const result = computeElevationMonitor([]);
    expect(result.n).toBe(0);
    expect(result.meanPSteered).toBeNull();
    expect(result.sufficientSample).toBe(false);
    expect(result.atOrNearChance).toBe(false);
  });

  it("computes the mean pSteered", () => {
    const result = computeElevationMonitor([0.6, 0.8, 1.0]);
    expect(result.meanPSteered).toBeCloseTo(0.8, 5);
  });

  it("does not flag atOrNearChance below the minimum sample size, even if the mean is low", () => {
    const values = Array(MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR - 1).fill(0.5);
    const result = computeElevationMonitor(values);
    expect(result.sufficientSample).toBe(false);
    expect(result.atOrNearChance).toBe(false);
  });

  it("flags atOrNearChance once sample size is sufficient and mean is at/near 0.5", () => {
    const values = Array(MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR).fill(0.5);
    const result = computeElevationMonitor(values);
    expect(result.sufficientSample).toBe(true);
    expect(result.atOrNearChance).toBe(true);
  });

  it("does not flag atOrNearChance when mean is well above chance with sufficient sample", () => {
    const values = Array(MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR).fill(0.9);
    const result = computeElevationMonitor(values);
    expect(result.atOrNearChance).toBe(false);
  });
});

describe("computeObsolescenceMonitor", () => {
  function makeRecords(model: string, n: number, headroomScoreShadow: number, startTimestamp: string): ModelEraRecord[] {
    return Array.from({ length: n }, (_, i) => ({
      model,
      headroomScoreShadow,
      timestamp: new Date(new Date(startTimestamp).getTime() + i * 1000).toISOString()
    }));
  }

  it("groups records by model and computes each era's mean headroomShadow", () => {
    const records = [
      ...makeRecords("model-a", 3, 0.5, "2026-01-01T00:00:00Z"),
      ...makeRecords("model-b", 2, 0.2, "2026-02-01T00:00:00Z")
    ];
    const result = computeObsolescenceMonitor(records);
    expect(result.eras).toHaveLength(2);
    expect(result.eras[0].model).toBe("model-a");
    expect(result.eras[0].meanHeadroomShadow).toBeCloseTo(0.5, 5);
    expect(result.eras[1].model).toBe("model-b");
    expect(result.eras[1].meanHeadroomShadow).toBeCloseTo(0.2, 5);
  });

  it("orders eras chronologically by earliest timestamp, not input order", () => {
    const records = [
      ...makeRecords("later-model", 2, 0.3, "2026-03-01T00:00:00Z"),
      ...makeRecords("earlier-model", 2, 0.4, "2026-01-01T00:00:00Z")
    ];
    const result = computeObsolescenceMonitor(records);
    expect(result.eras[0].model).toBe("earlier-model");
    expect(result.eras[1].model).toBe("later-model");
  });

  it("does not flag possibleObsolescence with fewer than 2 sufficiently-sampled eras", () => {
    const records = makeRecords("only-model", MIN_SAMPLE_SIZE_PER_ERA, 0.05, "2026-01-01T00:00:00Z");
    const result = computeObsolescenceMonitor(records);
    expect(result.possibleObsolescence).toBe(false);
  });

  it("flags possibleObsolescence when the latest sufficiently-sampled era collapses toward zero after a meaningful earlier era", () => {
    const records = [
      ...makeRecords("old-model", MIN_SAMPLE_SIZE_PER_ERA, 0.4, "2026-01-01T00:00:00Z"),
      ...makeRecords("new-model", MIN_SAMPLE_SIZE_PER_ERA, 0.05, "2026-06-01T00:00:00Z")
    ];
    const result = computeObsolescenceMonitor(records);
    expect(result.possibleObsolescence).toBe(true);
  });

  it("does not flag possibleObsolescence when the latest era is still meaningfully above zero", () => {
    const records = [
      ...makeRecords("old-model", MIN_SAMPLE_SIZE_PER_ERA, 0.4, "2026-01-01T00:00:00Z"),
      ...makeRecords("new-model", MIN_SAMPLE_SIZE_PER_ERA, 0.35, "2026-06-01T00:00:00Z")
    ];
    const result = computeObsolescenceMonitor(records);
    expect(result.possibleObsolescence).toBe(false);
  });

  it("ignores an under-sampled latest era when deciding possibleObsolescence", () => {
    const records = [
      ...makeRecords("old-model", MIN_SAMPLE_SIZE_PER_ERA, 0.4, "2026-01-01T00:00:00Z"),
      ...makeRecords("new-model", MIN_SAMPLE_SIZE_PER_ERA - 1, 0.0, "2026-06-01T00:00:00Z")
    ];
    const result = computeObsolescenceMonitor(records);
    // Only one era ("old-model") meets the minimum sample size -- can't compare.
    expect(result.possibleObsolescence).toBe(false);
  });
});

describe("computeVerbosityLeakageMonitor", () => {
  function pairs(n: number, fn: (i: number) => LeakageMonitorRecord): LeakageMonitorRecord[] {
    return Array.from({ length: n }, (_, i) => fn(i));
  }

  it("returns a null correlation and no flag for an empty record set", () => {
    const result = computeVerbosityLeakageMonitor([]);
    expect(result.n).toBe(0);
    expect(result.correlation).toBeNull();
    expect(result.possibleLeakage).toBe(false);
  });

  it("detects a strong positive correlation between edit magnitude and resolution", () => {
    // R rises in lockstep with edit size -- exactly the leakage pattern.
    const records = pairs(MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR, i => ({
      editDistanceNorm: i / MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR,
      resolution: i / MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR
    }));
    const result = computeVerbosityLeakageMonitor(records);
    expect(result.correlation).toBeCloseTo(1, 5);
    expect(result.possibleLeakage).toBe(true);
  });

  it("does not flag when resolution is independent of edit magnitude", () => {
    // Alternating R with steadily rising edit size -> near-zero correlation.
    const records = pairs(MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR, i => ({
      editDistanceNorm: i / MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR,
      resolution: i % 2 === 0 ? 0.4 : 0.6
    }));
    const result = computeVerbosityLeakageMonitor(records);
    expect(Math.abs(result.correlation!)).toBeLessThan(SUSPICIOUS_FOR_TEST);
    expect(result.possibleLeakage).toBe(false);
  });

  it("does not flag below the minimum sample size even with a perfect correlation", () => {
    const records = pairs(MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR - 1, i => ({
      editDistanceNorm: i / 10,
      resolution: i / 10
    }));
    const result = computeVerbosityLeakageMonitor(records);
    expect(result.correlation).toBeCloseTo(1, 5);
    expect(result.sufficientSample).toBe(false);
    expect(result.possibleLeakage).toBe(false);
  });

  it("does not flag a strong NEGATIVE correlation (smaller edits closing more gaps is not leakage)", () => {
    const records = pairs(MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR, i => ({
      editDistanceNorm: i / MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR,
      resolution: 1 - i / MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR
    }));
    const result = computeVerbosityLeakageMonitor(records);
    expect(result.correlation).toBeCloseTo(-1, 5);
    expect(result.possibleLeakage).toBe(false);
  });

  it("returns a null correlation when edit magnitude has no variance", () => {
    const records = pairs(MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR, i => ({
      editDistanceNorm: 0.5,
      resolution: i / MIN_SAMPLE_SIZE_FOR_LEAKAGE_MONITOR
    }));
    const result = computeVerbosityLeakageMonitor(records);
    expect(result.correlation).toBeNull();
    expect(result.possibleLeakage).toBe(false);
  });
});

// Mirrors the module's private SUSPICIOUS_LEAKAGE_CORRELATION threshold; kept
// local so the test asserts against an explicit number rather than importing
// an internal constant.
const SUSPICIOUS_FOR_TEST = 0.5;
