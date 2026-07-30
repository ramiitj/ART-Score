import { describe, it, expect } from "vitest";
import { computeScoreShiftReport } from "../scoreShiftReport";
import type { ScoreShiftRecord } from "../scoreShiftReport";

function record(overrides: Partial<ScoreShiftRecord> = {}): ScoreShiftRecord {
  return {
    oldScore: 50,
    newScoreShadow: 0.5,
    validityGatePassed: true,
    ...overrides
  };
}

describe("computeScoreShiftReport", () => {
  it("returns all-null/zero for an empty record set", () => {
    const report = computeScoreShiftReport([]);
    expect(report.n).toBe(0);
    expect(report.meanOldScore).toBeNull();
    expect(report.meanNewScore).toBeNull();
    expect(report.meanDiff).toBeNull();
    expect(report.correlation).toBeNull();
    expect(report.gatePassedCount).toBe(0);
    expect(report.gateFailedCount).toBe(0);
  });

  it("computes mean old/new scores (new scaled to 0-100) and their difference", () => {
    const records = [
      record({ oldScore: 40, newScoreShadow: 0.3 }),
      record({ oldScore: 60, newScoreShadow: 0.7 })
    ];
    const report = computeScoreShiftReport(records);
    expect(report.n).toBe(2);
    expect(report.meanOldScore).toBe(50);
    expect(report.meanNewScore).toBe(50); // (30+70)/2
    expect(report.meanDiff).toBe(0);
  });

  it("reports a positive meanDiff when the new score runs higher than the old score", () => {
    const records = [
      record({ oldScore: 20, newScoreShadow: 0.5 }),
      record({ oldScore: 20, newScoreShadow: 0.5 })
    ];
    const report = computeScoreShiftReport(records);
    expect(report.meanDiff).toBe(30); // 50 - 20
  });

  it("counts validity gate pass/fail split", () => {
    const records = [
      record({ validityGatePassed: true }),
      record({ validityGatePassed: true }),
      record({ validityGatePassed: false })
    ];
    const report = computeScoreShiftReport(records);
    expect(report.gatePassedCount).toBe(2);
    expect(report.gateFailedCount).toBe(1);
  });

  it("computes a perfect positive correlation when new score scales linearly with old score", () => {
    const records = [
      record({ oldScore: 0, newScoreShadow: 0 }),
      record({ oldScore: 50, newScoreShadow: 0.5 }),
      record({ oldScore: 100, newScoreShadow: 1 })
    ];
    const report = computeScoreShiftReport(records);
    expect(report.correlation).toBeCloseTo(1, 5);
  });

  it("computes a perfect negative correlation when new score moves opposite to old score", () => {
    const records = [
      record({ oldScore: 0, newScoreShadow: 1 }),
      record({ oldScore: 50, newScoreShadow: 0.5 }),
      record({ oldScore: 100, newScoreShadow: 0 })
    ];
    const report = computeScoreShiftReport(records);
    expect(report.correlation).toBeCloseTo(-1, 5);
  });

  it("returns null correlation with fewer than 2 records", () => {
    const report = computeScoreShiftReport([record()]);
    expect(report.correlation).toBeNull();
  });

  it("returns null correlation when one series has zero variance", () => {
    const records = [
      record({ oldScore: 50, newScoreShadow: 0.1 }),
      record({ oldScore: 50, newScoreShadow: 0.9 })
    ];
    const report = computeScoreShiftReport(records);
    expect(report.correlation).toBeNull();
  });
});
