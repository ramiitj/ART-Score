import { describe, it, expect } from "vitest";
import { computeHeadroomShadow } from "../headroomShadow";
import type { PairedComparisonResult, ManifestResolutionResult } from "../types";

function paired(overrides: Partial<PairedComparisonResult> = {}): PairedComparisonResult {
  return {
    steeredWins: 3,
    passCount: 3,
    pSteered: 1,
    btLogOdds: 1.9459,
    disagreement: false,
    validityGatePassed: true,
    passes: [],
    ...overrides
  };
}

function manifest(overrides: Partial<ManifestResolutionResult> = {}): ManifestResolutionResult {
  return {
    items: [],
    closableCount: 4,
    resolvedCount: 3,
    resolution: 0.75,
    ...overrides
  };
}

describe("computeHeadroomShadow", () => {
  it("passes resolution through when the validity gate is passed", () => {
    const result = computeHeadroomShadow(paired({ validityGatePassed: true }), manifest({ resolution: 0.75 }));
    expect(result.headroomScoreShadow).toBe(0.75);
    expect(result.resolution).toBe(0.75);
  });

  it("zeroes the shadow score when the validity gate fails, regardless of resolution", () => {
    const result = computeHeadroomShadow(paired({ validityGatePassed: false }), manifest({ resolution: 0.9 }));
    expect(result.headroomScoreShadow).toBe(0);
    expect(result.resolution).toBe(0.9); // raw resolution is still reported for analysis
  });
});
