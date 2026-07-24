import { describe, it, expect } from "vitest";
import { medianOfThree, aggregatePasses } from "../aggregation";
import type { JudgePassResult } from "../types";

function makePass(overrides: Partial<JudgePassResult> = {}): JudgePassResult {
  return {
    clarityScore: 10,
    clarityRationale: "r",
    depthScore: 10,
    depthRationale: "r",
    structureScore: 10,
    structureRationale: "r",
    actionabilityScore: 10,
    actionabilityRationale: "r",
    domainScore: 10,
    domainRationale: "r",
    strengths: [],
    insight: "insight",
    diffInventory: [],
    selfChecks: "checks",
    confidence: "high",
    mitigationAssessment: [],
    integrityViolation: false,
    ...overrides
  };
}

describe("medianOfThree", () => {
  it("returns the middle value regardless of input order", () => {
    expect(medianOfThree(10, 15, 12)).toBe(12);
    expect(medianOfThree(15, 10, 12)).toBe(12);
    expect(medianOfThree(12, 15, 10)).toBe(12);
  });

  it("handles duplicate values", () => {
    expect(medianOfThree(5, 5, 5)).toBe(5);
    expect(medianOfThree(0, 5, 5)).toBe(5);
  });

  it("handles negative numbers", () => {
    expect(medianOfThree(-5, 3, -1)).toBe(-1);
  });
});

describe("aggregatePasses", () => {
  it("returns null when fewer than 3 passes are provided", () => {
    expect(aggregatePasses([])).toBeNull();
    expect(aggregatePasses([makePass()])).toBeNull();
    expect(aggregatePasses([makePass(), makePass()])).toBeNull();
  });

  it("computes per-dimension medians, total, and spreads across exactly 3 passes", () => {
    const passes = [
      makePass({ clarityScore: 10, depthScore: 5, structureScore: 20, actionabilityScore: 8, domainScore: 14 }),
      makePass({ clarityScore: 15, depthScore: 5, structureScore: 0, actionabilityScore: 9, domainScore: 14 }),
      makePass({ clarityScore: 12, depthScore: 5, structureScore: 10, actionabilityScore: 8, domainScore: 14 })
    ];

    const result = aggregatePasses(passes);

    expect(result).not.toBeNull();
    expect(result!.medians).toEqual({
      clarity: 12,
      depth: 5,
      structure: 10,
      actionability: 8,
      domain: 14
    });
    expect(result!.total).toBe(49); // 12 + 5 + 10 + 8 + 14
    expect(result!.dimensionSpreads).toEqual({
      clarity: 5,       // 15 - 10
      depth: 0,         // 5 - 5
      structure: 20,    // 20 - 0
      actionability: 1, // 9 - 8
      domain: 0         // 14 - 14
    });
    expect(result!.spread).toBe(20); // max of the per-dimension spreads
    expect(result!.passes).toBe(passes);
  });

  it("only uses the first three passes if more are provided", () => {
    const passes = [
      makePass({ clarityScore: 10 }),
      makePass({ clarityScore: 10 }),
      makePass({ clarityScore: 10 }),
      makePass({ clarityScore: 20 }) // should be ignored
    ];
    const result = aggregatePasses(passes);
    expect(result!.medians.clarity).toBe(10);
  });
});
