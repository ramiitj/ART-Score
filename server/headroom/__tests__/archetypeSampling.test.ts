import { describe, it, expect } from "vitest";
import { selectTaskArchetype } from "../archetypeSampling";

describe("selectTaskArchetype", () => {
  it("returns null for an empty pool", () => {
    expect(selectTaskArchetype([], [], () => 0)).toBeNull();
  });

  it("draws from the pool when nothing has been used yet", () => {
    const result = selectTaskArchetype(["a", "b", "c"], [], () => 0);
    expect(result).toBe("a");
  });

  it("never redraws an archetype already used in the run", () => {
    // "a" and "b" used; only "c" remains, so any random value must yield "c".
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(selectTaskArchetype(["a", "b", "c"], ["a", "b"], () => r)).toBe("c");
    }
  });

  it("falls back to the full pool once every archetype has been used", () => {
    const result = selectTaskArchetype(["a", "b"], ["a", "b"], () => 0);
    expect(["a", "b"]).toContain(result);
  });

  it("ignores used archetypes that are not in the pool", () => {
    const result = selectTaskArchetype(["a"], ["x", "y"], () => 0);
    expect(result).toBe("a");
  });

  it("clamps a random() value of exactly 1 to the last element rather than overflowing", () => {
    // Math.random() is documented as [0,1), but guard against a 1 anyway --
    // an out-of-range index would silently return undefined.
    const result = selectTaskArchetype(["a", "b", "c"], [], () => 1);
    expect(result).toBe("c");
  });

  it("covers the whole unused pool across repeated draws", () => {
    const pool = ["a", "b", "c"];
    const seen = new Set<string>();
    for (const r of [0, 0.4, 0.9]) {
      seen.add(selectTaskArchetype(pool, [], () => r)!);
    }
    expect(seen.size).toBe(3);
  });
});
