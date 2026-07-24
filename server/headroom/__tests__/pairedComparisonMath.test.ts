import { describe, it, expect } from "vitest";
import { buildPairedComparisonPrompt, aggregatePairedComparison } from "../pairedComparisonMath";
import type { PairedPassRaw } from "../types";

describe("buildPairedComparisonPrompt", () => {
  it("embeds the task and both options blind (no identity hints)", () => {
    const prompt = buildPairedComparisonPrompt("Write a memo.", "Draft one.", "Draft two.");
    expect(prompt).toContain("Write a memo.");
    expect(prompt).toContain("Draft one.");
    expect(prompt).toContain("Draft two.");
    expect(prompt).not.toMatch(/human|steered|ceiling|revision/i);
  });
});

describe("aggregatePairedComparison", () => {
  function pass(steeredIsA: boolean, winner: "A" | "B"): PairedPassRaw {
    return { steeredIsA, winner, margin: 2, rationale: "r" };
  }

  it("un-randomizes position and counts steered wins correctly (3-0 steered)", () => {
    const result = aggregatePairedComparison([
      pass(true, "A"),   // steered=A, A wins -> steered won
      pass(false, "B"),  // steered=B, B wins -> steered won
      pass(true, "A")    // steered=A, A wins -> steered won
    ]);
    expect(result.steeredWins).toBe(3);
    expect(result.pSteered).toBe(1);
    expect(result.disagreement).toBe(false);
    expect(result.validityGatePassed).toBe(true);
    expect(result.btLogOdds).toBeCloseTo(Math.log(3.5 / 0.5), 10);
  });

  it("un-randomizes position and counts ceiling wins correctly (0-3 steered)", () => {
    const result = aggregatePairedComparison([
      pass(true, "B"),   // steered=A, B wins -> steered lost
      pass(false, "A"),  // steered=B, A wins -> steered lost
      pass(true, "B")    // steered=A, B wins -> steered lost
    ]);
    expect(result.steeredWins).toBe(0);
    expect(result.pSteered).toBe(0);
    expect(result.disagreement).toBe(false);
    expect(result.validityGatePassed).toBe(false);
    expect(result.btLogOdds).toBeCloseTo(Math.log(0.5 / 3.5), 10);
  });

  it("flags disagreement on a split decision and fails the gate at 1/3", () => {
    const result = aggregatePairedComparison([
      pass(true, "A"),   // steered=A, A wins -> steered won
      pass(false, "A"),  // steered=B, A wins -> steered lost (ceiling won)
      pass(true, "B")    // steered=A, B wins -> steered lost (ceiling won)
    ]);
    expect(result.steeredWins).toBe(1);
    expect(result.pSteered).toBeCloseTo(1 / 3, 10);
    expect(result.disagreement).toBe(true);
    expect(result.validityGatePassed).toBe(false);
    expect(result.btLogOdds).toBeCloseTo(Math.log(1.5 / 2.5), 10);
  });

  it("passes the validity gate exactly at 2/3 (the documented threshold)", () => {
    const result = aggregatePairedComparison([
      pass(true, "A"),
      pass(false, "B"),
      pass(true, "B") // steered=A, B wins -> steered lost
    ]);
    expect(result.steeredWins).toBe(2);
    expect(result.pSteered).toBeCloseTo(2 / 3, 10);
    expect(result.disagreement).toBe(true);
    expect(result.validityGatePassed).toBe(true);
  });
});
