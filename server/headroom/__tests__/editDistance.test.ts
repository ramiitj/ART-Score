import { describe, it, expect } from "vitest";
import { computeEditDistance } from "../editDistance";

describe("computeEditDistance", () => {
  it("is zero for identical prompts", () => {
    const result = computeEditDistance("write a short memo about the delay", "write a short memo about the delay");
    expect(result.editDistance).toBe(0);
    expect(result.editDistanceNorm).toBe(0);
  });

  it("counts a single word substitution as distance 1", () => {
    // "write a short memo" -> "write a long memo": one substitution (short -> long)
    const result = computeEditDistance("write a short memo", "write a long memo");
    expect(result.editDistance).toBe(1);
    expect(result.editDistanceNorm).toBeCloseTo(1 / 4, 5);
  });

  it("counts a single word insertion as distance 1", () => {
    // "write a memo" (3 words) -> "write a short memo" (4 words): one insertion
    const result = computeEditDistance("write a memo", "write a short memo");
    expect(result.editDistance).toBe(1);
    expect(result.editDistanceNorm).toBeCloseTo(1 / 3, 5);
  });

  it("counts a single word deletion as distance 1", () => {
    // "write a short memo" (4 words) -> "write a memo" (3 words): one deletion
    const result = computeEditDistance("write a short memo", "write a memo");
    expect(result.editDistance).toBe(1);
    expect(result.editDistanceNorm).toBeCloseTo(1 / 4, 5);
  });

  it("treats a fully different prompt of equal length as distance equal to word count", () => {
    const result = computeEditDistance("one two three", "four five six");
    expect(result.editDistance).toBe(3);
    expect(result.editDistanceNorm).toBe(1);
  });

  it("clamps editDistanceNorm to 1 when the edited prompt is far longer than the baseline", () => {
    const result = computeEditDistance("short", "a much longer and completely rewritten prompt about the same task");
    expect(result.editDistanceNorm).toBe(1);
  });

  it("returns editDistanceNorm=0 when the baseline prompt is empty", () => {
    const result = computeEditDistance("", "some new content");
    expect(result.editDistanceNorm).toBe(0);
  });

  it("collapses whitespace differences (not a real edit)", () => {
    const result = computeEditDistance("write   a  memo", "write a memo");
    expect(result.editDistance).toBe(0);
  });
});
