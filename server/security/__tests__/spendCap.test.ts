import { describe, it, expect } from "vitest";
import { checkAndIncrementCap } from "../spendCap";
import type { DailyCapState } from "../spendCap";

describe("checkAndIncrementCap", () => {
  it("allows and increments when under the cap", () => {
    const state: DailyCapState = { date: "2026-07-24", count: 3 };
    const result = checkAndIncrementCap(state, 10, "2026-07-24T12:00:00.000Z");
    expect(result.allowed).toBe(true);
    expect(result.state).toEqual({ date: "2026-07-24", count: 4 });
  });

  it("denies once the cap is reached, without incrementing further", () => {
    const state: DailyCapState = { date: "2026-07-24", count: 10 };
    const result = checkAndIncrementCap(state, 10, "2026-07-24T12:00:00.000Z");
    expect(result.allowed).toBe(false);
    expect(result.state).toEqual({ date: "2026-07-24", count: 10 });
  });

  it("resets the count on a new calendar day", () => {
    const state: DailyCapState = { date: "2026-07-23", count: 10 };
    const result = checkAndIncrementCap(state, 10, "2026-07-24T00:00:01.000Z");
    expect(result.allowed).toBe(true);
    expect(result.state).toEqual({ date: "2026-07-24", count: 1 });
  });

  it("starts a fresh state correctly on the first call of the day", () => {
    const state: DailyCapState = { date: "", count: 0 };
    const result = checkAndIncrementCap(state, 5, "2026-07-24T00:00:00.000Z");
    expect(result.allowed).toBe(true);
    expect(result.state).toEqual({ date: "2026-07-24", count: 1 });
  });
});
