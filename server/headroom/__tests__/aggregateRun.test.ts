import { describe, it, expect } from "vitest";
import { aggregateRunResults } from "../aggregateRun";
import type { RunItemResult } from "../aggregateRun";

function item(overrides: Partial<RunItemResult> = {}): RunItemResult {
  return {
    sessionId: "s1",
    domain: "Software Engineering",
    difficulty: "Intermediate",
    score: 70,
    headroomScoreShadow: 0.5,
    comparable: true,
    status: "completed",
    ...overrides
  };
}

describe("aggregateRunResults", () => {
  it("computes mean and SE across comparable completed items", () => {
    const items = [
      item({ sessionId: "s1", score: 60, headroomScoreShadow: 0.4 }),
      item({ sessionId: "s2", score: 80, headroomScoreShadow: 0.6 }),
      item({ sessionId: "s3", score: 70, headroomScoreShadow: 0.5 })
    ];
    const result = aggregateRunResults(3, items);

    expect(result.itemsCompleted).toBe(3);
    expect(result.allItemsCompleted).toBe(true);
    expect(result.meanScore).toBeCloseTo(70, 5);
    expect(result.meanHeadroomShadow).toBeCloseTo(0.5, 5);
    // sample variance of [60,80,70] = 100, SE = sqrt(100/3)
    expect(result.scoreSE).toBeCloseTo(Math.sqrt(100 / 3), 5);
  });

  it("excludes non-comparable items from the mean but keeps them in the item list", () => {
    const items = [
      item({ sessionId: "s1", score: 60, comparable: true }),
      item({ sessionId: "s2", score: 0, comparable: false })
    ];
    const result = aggregateRunResults(2, items);

    expect(result.items).toHaveLength(2);
    expect(result.meanScore).toBe(60);
  });

  it("reports allItemsCompleted=false when fewer items than itemsTotal have completed", () => {
    const items = [item({ sessionId: "s1" })];
    const result = aggregateRunResults(3, items);

    expect(result.itemsCompleted).toBe(1);
    expect(result.allItemsCompleted).toBe(false);
  });

  it("excludes scoring_pending and rejected items from completed/comparable counts", () => {
    const items = [
      item({ sessionId: "s1", status: "completed" }),
      item({ sessionId: "s2", status: "scoring_pending" }),
      item({ sessionId: "s3", status: "rejected" })
    ];
    const result = aggregateRunResults(3, items);

    expect(result.itemsCompleted).toBe(1);
    expect(result.items).toHaveLength(3);
  });

  it("returns null mean/SE when no comparable items exist", () => {
    const result = aggregateRunResults(1, [item({ comparable: false })]);
    expect(result.meanScore).toBeNull();
    expect(result.scoreSE).toBeNull();
    expect(result.meanHeadroomShadow).toBeNull();
    expect(result.headroomShadowSE).toBeNull();
  });

  it("returns null SE (but a real mean) for a single comparable item", () => {
    const result = aggregateRunResults(1, [item({ score: 55, headroomScoreShadow: 0.3 })]);
    expect(result.meanScore).toBe(55);
    expect(result.scoreSE).toBeNull();
    expect(result.meanHeadroomShadow).toBe(0.3);
    expect(result.headroomShadowSE).toBeNull();
  });

  it("excludes null headroomScoreShadow values from the shadow mean without affecting the score mean", () => {
    const items = [
      item({ sessionId: "s1", score: 60, headroomScoreShadow: null }),
      item({ sessionId: "s2", score: 80, headroomScoreShadow: 0.6 })
    ];
    const result = aggregateRunResults(2, items);
    expect(result.meanScore).toBe(70);
    expect(result.meanHeadroomShadow).toBe(0.6);
  });
});
