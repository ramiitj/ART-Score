import { describe, it, expect, vi, afterEach } from "vitest";
import { judgePairedComparison, judgeManifestResolution } from "../judge";
import type { GapItem } from "../types";
import type { GoogleGenAI } from "@google/genai";

function mockAi(responses: string[]): GoogleGenAI {
  let call = 0;
  return {
    models: {
      generateContent: vi.fn(async () => ({ text: responses[call++] }))
    }
  } as unknown as GoogleGenAI;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("judgePairedComparison", () => {
  it("randomizes position per pass and un-randomizes winners back to steered/ceiling", async () => {
    // Forces steeredIsA = [true, false, true] across the 3 passes (< 0.5 => true).
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.9).mockReturnValueOnce(0.1);

    const ai = mockAi([
      JSON.stringify({ winner: "A", margin: 2, rationale: "A better" }), // steeredIsA=true, A wins -> steered won
      JSON.stringify({ winner: "A", margin: 1, rationale: "A better" }), // steeredIsA=false, A(ceiling) wins -> steered lost
      JSON.stringify({ winner: "B", margin: 3, rationale: "B better" })  // steeredIsA=true, B(ceiling) wins -> steered lost
    ]);

    const result = await judgePairedComparison(ai, "task", "ceiling output", "steered output");

    expect(result).not.toBeNull();
    expect(result!.steeredWins).toBe(1);
    expect(result!.passCount).toBe(3);
    expect(result!.disagreement).toBe(true);
    expect(result!.validityGatePassed).toBe(false);

    // Confirm the steered output actually landed in the position Math.random dictated,
    // and that the prompt never reveals which slot is the human's.
    const calls = (ai.models.generateContent as any).mock.calls;
    expect(calls[0][0].contents).toContain('OUTPUT A:\n"steered output"');
    expect(calls[1][0].contents).toContain('OUTPUT B:\n"steered output"');
    expect(calls[2][0].contents).toContain('OUTPUT A:\n"steered output"');
    // The fixed instruction (not the arbitrary output text under test) must never
    // reveal which slot is the human's.
    for (const call of calls) {
      expect(call[0].config.systemInstruction).not.toMatch(/human-authored|which is the human|which is steered/i);
    }
  });

  it("returns null when fewer than the required number of passes succeed", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const ai = mockAi([
      JSON.stringify({ winner: "A", margin: 1, rationale: "r" }),
      "not valid json",
      JSON.stringify({ winner: "A", margin: 1, rationale: "r" })
    ]);
    const result = await judgePairedComparison(ai, "task", "ceiling", "steered");
    expect(result).toBeNull();
  });
});

describe("judgeManifestResolution", () => {
  const gapManifest: GapItem[] = [{ id: "G1", dimension: "Depth", description: "Adds a mechanism." }];

  it("randomizes position per pass and un-randomizes resolution back to steered/ceiling", async () => {
    // Forces steeredIsX = [true, false, true].
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.9).mockReturnValueOnce(0.1);

    const ai = mockAi([
      // steeredIsX=true: X=steered, Y=ceiling. Ceiling(Y) never resolves; steered(X) resolves.
      JSON.stringify({ items: [{ id: "G1", resolvedInX: true, resolvedInY: false, rationale: "" }] }),
      // steeredIsX=false: X=ceiling, Y=steered. Ceiling(X) never resolves; steered(Y) resolves.
      JSON.stringify({ items: [{ id: "G1", resolvedInX: false, resolvedInY: true, rationale: "" }] }),
      // steeredIsX=true: X=steered, Y=ceiling. Ceiling(Y) never resolves; steered(X) resolves.
      JSON.stringify({ items: [{ id: "G1", resolvedInX: true, resolvedInY: false, rationale: "" }] })
    ]);

    const result = await judgeManifestResolution(ai, "task", gapManifest, "ceiling output", "steered output");

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([
      { id: "G1", dimension: "Depth", resolvedInCeiling: false, resolvedInSteered: true }
    ]);
    expect(result!.closableCount).toBe(1);
    expect(result!.resolvedCount).toBe(1);
    expect(result!.resolution).toBe(1);

    const calls = (ai.models.generateContent as any).mock.calls;
    expect(calls[0][0].contents).toContain('OUTPUT X:\n"steered output"');
    expect(calls[1][0].contents).toContain('OUTPUT Y:\n"steered output"');
  });

  it("returns null immediately for an empty manifest without calling the model", async () => {
    const ai = mockAi([]);
    const result = await judgeManifestResolution(ai, "task", [], "ceiling", "steered");
    expect(result).toBeNull();
    expect(ai.models.generateContent).not.toHaveBeenCalled();
  });

  it("returns null when fewer than the required number of passes succeed", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const ai = mockAi([
      JSON.stringify({ items: [{ id: "G1", resolvedInX: true, resolvedInY: false, rationale: "" }] }),
      "not valid json",
      JSON.stringify({ items: [{ id: "G1", resolvedInX: true, resolvedInY: false, rationale: "" }] })
    ]);
    const result = await judgeManifestResolution(ai, "task", gapManifest, "ceiling", "steered");
    expect(result).toBeNull();
  });
});
