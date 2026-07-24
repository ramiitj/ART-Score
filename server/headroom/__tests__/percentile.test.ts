import { describe, it, expect } from "vitest";
import { computePercentile, MIN_PERCENTILE_SAMPLE_SIZE } from "../percentile";

describe("computePercentile", () => {
  it("computes the fraction of the reference pool strictly below the score", () => {
    const result = computePercentile(35, [10, 20, 30, 40, 50]);
    expect(result.percentile).toBe(60); // 3 of 5 below (10, 20, 30)
  });

  it("counts ties as half-below (mid-rank convention)", () => {
    const result = computePercentile(30, [10, 20, 30, 40, 50]);
    expect(result.percentile).toBe(50); // 2 below + 0.5*1 tied = 2.5 of 5
  });

  it("returns 100th percentile when the score beats the entire pool", () => {
    const result = computePercentile(100, [10, 20, 30]);
    expect(result.percentile).toBe(100);
  });

  it("returns 0th percentile when the score is below the entire pool", () => {
    const result = computePercentile(1, [10, 20, 30]);
    expect(result.percentile).toBe(0);
  });

  it("flags insufficient data for an empty reference pool without erroring", () => {
    const result = computePercentile(50, []);
    expect(result).toEqual({ percentile: 0, sampleSize: 0, sufficientData: false });
  });

  it("flags insufficient data below the minimum sample size threshold", () => {
    const smallPool = Array.from({ length: MIN_PERCENTILE_SAMPLE_SIZE - 1 }, (_, i) => i);
    const result = computePercentile(50, smallPool);
    expect(result.sufficientData).toBe(false);
  });

  it("flags sufficient data at exactly the minimum sample size threshold", () => {
    const pool = Array.from({ length: MIN_PERCENTILE_SAMPLE_SIZE }, (_, i) => i);
    const result = computePercentile(50, pool);
    expect(result.sufficientData).toBe(true);
  });
});
