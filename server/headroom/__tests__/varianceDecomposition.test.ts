import { describe, it, expect } from "vitest";
import { decomposeVariance, MIN_REPEATED_PERSONS_FOR_RELIABLE_ESTIMATE } from "../varianceDecomposition";
import type { VarianceDecompositionRecord } from "../varianceDecomposition";

describe("decomposeVariance", () => {
  it("attributes all variance to person when item means are identical and person means differ", () => {
    // A: consistently high (80, 70), B: consistently low (40, 50).
    // Item means are equal (X: (80+40)/2=60, Y: (70+50)/2=60), so item should
    // explain none of the variance while person explains almost all of it.
    const records: VarianceDecompositionRecord[] = [
      { personKey: "A", itemKey: "X", value: 80 },
      { personKey: "A", itemKey: "Y", value: 70 },
      { personKey: "B", itemKey: "X", value: 40 },
      { personKey: "B", itemKey: "Y", value: 50 }
    ];

    const result = decomposeVariance(records);

    // Hand-computed: grand mean 60, SS_total 1000, SS_between_person 900 -> 0.9
    expect(result.personVariance.varianceShare).toBeCloseTo(0.9, 10);
    // SS_between_item 0 -> 0
    expect(result.itemVariance.varianceShare).toBeCloseTo(0, 10);
    expect(result.totalN).toBe(4);
    expect(result.uniquePersons).toBe(2);
    expect(result.uniqueItems).toBe(2);
  });

  it("attributes all variance to item when person means are identical and item means differ", () => {
    // Mirror case: every person scores the same on a given item, but items differ.
    const records: VarianceDecompositionRecord[] = [
      { personKey: "A", itemKey: "X", value: 80 },
      { personKey: "B", itemKey: "X", value: 80 },
      { personKey: "A", itemKey: "Y", value: 40 },
      { personKey: "B", itemKey: "Y", value: 40 }
    ];

    const result = decomposeVariance(records);

    expect(result.itemVariance.varianceShare).toBeCloseTo(1, 10);
    expect(result.personVariance.varianceShare).toBeCloseTo(0, 10);
  });

  it("counts persons with 2+ attempts and flags reliability against the threshold", () => {
    const records: VarianceDecompositionRecord[] = [
      { personKey: "A", itemKey: "X", value: 50 },
      { personKey: "A", itemKey: "Y", value: 60 },
      { personKey: "B", itemKey: "X", value: 55 } // B has only 1 attempt
    ];

    const result = decomposeVariance(records);

    expect(result.personsWithRepeatedAttempts).toBe(1); // only A
    expect(result.sufficientRepeatedMeasures).toBe(false);
  });

  it("flags sufficient repeated measures once enough persons have 2+ attempts", () => {
    const records: VarianceDecompositionRecord[] = [];
    for (let i = 0; i < MIN_REPEATED_PERSONS_FOR_RELIABLE_ESTIMATE; i++) {
      records.push({ personKey: `P${i}`, itemKey: "X", value: 50 });
      records.push({ personKey: `P${i}`, itemKey: "Y", value: 55 });
    }

    const result = decomposeVariance(records);

    expect(result.personsWithRepeatedAttempts).toBe(MIN_REPEATED_PERSONS_FOR_RELIABLE_ESTIMATE);
    expect(result.sufficientRepeatedMeasures).toBe(true);
  });

  it("handles an empty input without dividing by zero", () => {
    const result = decomposeVariance([]);
    expect(result.totalN).toBe(0);
    expect(result.personVariance).toEqual({ groupCount: 0, varianceShare: 0 });
    expect(result.itemVariance).toEqual({ groupCount: 0, varianceShare: 0 });
  });

  it("returns zero variance share when every value is identical (SS_total = 0)", () => {
    const records: VarianceDecompositionRecord[] = [
      { personKey: "A", itemKey: "X", value: 50 },
      { personKey: "B", itemKey: "Y", value: 50 }
    ];
    const result = decomposeVariance(records);
    expect(result.personVariance.varianceShare).toBe(0);
    expect(result.itemVariance.varianceShare).toBe(0);
  });
});
