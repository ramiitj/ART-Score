import { describe, it, expect } from "vitest";
import { assessCeilingStability } from "../ceilingStability";
import type { PairedComparisonResult } from "../types";

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

describe("assessCeilingStability", () => {
  it("is stable with no stronger output when passes split (disagreement)", () => {
    const result = assessCeilingStability(paired({ disagreement: true, steeredWins: 2, passCount: 3 }));
    expect(result.stable).toBe(true);
    expect(result.strongerOutput).toBeNull();
  });

  it("is unstable and picks B when B (the second/steered argument) wins every pass", () => {
    const result = assessCeilingStability(paired({ disagreement: false, steeredWins: 3, passCount: 3 }));
    expect(result.stable).toBe(false);
    expect(result.strongerOutput).toBe("B");
  });

  it("is unstable and picks A when A (the first/ceiling argument) wins every pass", () => {
    const result = assessCeilingStability(paired({ disagreement: false, steeredWins: 0, passCount: 3 }));
    expect(result.stable).toBe(false);
    expect(result.strongerOutput).toBe("A");
  });
});
