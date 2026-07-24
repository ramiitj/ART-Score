import { describe, it, expect } from "vitest";
import { buildGapManifestPrompt, buildManifestResolutionPrompt, aggregateManifestResolution } from "../manifestMath";
import type { GapItem, ManifestPassRaw } from "../types";

describe("buildGapManifestPrompt", () => {
  it("asks for improvement gaps, not baseline errors", () => {
    const prompt = buildGapManifestPrompt("Write a memo.", "Draft memo text.", "Marketing");
    expect(prompt).toContain("Write a memo.");
    expect(prompt).toContain("Draft memo text.");
    expect(prompt).toContain("Marketing");
    expect(prompt).toMatch(/independently\s+checkable/i);
  });
});

describe("buildManifestResolutionPrompt", () => {
  it("lists every gap and embeds both options blind", () => {
    const gaps: GapItem[] = [{ id: "G1", dimension: "Depth", description: "Add a mechanism." }];
    const prompt = buildManifestResolutionPrompt("Task text", gaps, "Option X text", "Option Y text");
    expect(prompt).toContain("G1 (Depth): Add a mechanism.");
    expect(prompt).toContain("Option X text");
    expect(prompt).toContain("Option Y text");
    expect(prompt).not.toMatch(/human|steered|ceiling/i);
  });
});

describe("aggregateManifestResolution", () => {
  const gapManifest: GapItem[] = [
    { id: "G1", dimension: "Depth", description: "Adds a mechanism." },
    { id: "G2", dimension: "Specificity", description: "Replaces generic claims." },
    { id: "G3", dimension: "Structure", description: "Reorganizes for followability." }
  ];

  // Position (X/Y) is deliberately mixed across passes to exercise un-randomization.
  const rawPasses: ManifestPassRaw[] = [
    {
      steeredIsX: true, // steered=X, ceiling=Y
      items: [
        { id: "G1", resolvedInX: true, resolvedInY: true, rationale: "" },   // ceiling(Y)=true, steered(X)=true
        { id: "G2", resolvedInX: true, resolvedInY: false, rationale: "" },  // ceiling(Y)=false, steered(X)=true
        { id: "G3", resolvedInX: false, resolvedInY: true, rationale: "" }   // ceiling(Y)=true, steered(X)=false
      ]
    },
    {
      steeredIsX: false, // steered=Y, ceiling=X
      items: [
        { id: "G1", resolvedInX: true, resolvedInY: true, rationale: "" },   // ceiling(X)=true, steered(Y)=true
        { id: "G2", resolvedInX: false, resolvedInY: true, rationale: "" },  // ceiling(X)=false, steered(Y)=true
        { id: "G3", resolvedInX: false, resolvedInY: false, rationale: "" }  // ceiling(X)=false, steered(Y)=false
      ]
    },
    {
      steeredIsX: true, // steered=X, ceiling=Y
      items: [
        { id: "G1", resolvedInX: true, resolvedInY: false, rationale: "" },  // ceiling(Y)=false, steered(X)=true
        { id: "G2", resolvedInX: true, resolvedInY: false, rationale: "" },  // ceiling(Y)=false, steered(X)=true
        { id: "G3", resolvedInX: false, resolvedInY: false, rationale: "" }  // ceiling(Y)=false, steered(X)=false
      ]
    }
  ];

  it("un-randomizes position, takes a per-gap majority vote, and computes resolution over closable gaps only", () => {
    const result = aggregateManifestResolution(gapManifest, rawPasses);

    // G1: ceiling resolves it in 2/3 passes -> majority -> resolvedInCeiling true -> not closable.
    // G2: ceiling never resolves it (0/3) -> closable; steered resolves it 3/3 -> resolved.
    // G3: ceiling resolves it in only 1/3 (minority) -> not resolvedInCeiling -> closable; steered never resolves it -> not resolved.
    expect(result.items).toEqual([
      { id: "G1", dimension: "Depth", resolvedInCeiling: true, resolvedInSteered: true },
      { id: "G2", dimension: "Specificity", resolvedInCeiling: false, resolvedInSteered: true },
      { id: "G3", dimension: "Structure", resolvedInCeiling: false, resolvedInSteered: false }
    ]);
    expect(result.closableCount).toBe(2); // G2, G3
    expect(result.resolvedCount).toBe(1); // G2 only
    expect(result.resolution).toBeCloseTo(0.5, 10);
  });

  it("returns resolution 0 (not NaN) when nothing is closable", () => {
    const allCeilingResolved: ManifestPassRaw[] = [
      { steeredIsX: true, items: [{ id: "G1", resolvedInX: true, resolvedInY: true, rationale: "" }] },
      { steeredIsX: true, items: [{ id: "G1", resolvedInX: true, resolvedInY: true, rationale: "" }] },
      { steeredIsX: true, items: [{ id: "G1", resolvedInX: true, resolvedInY: true, rationale: "" }] }
    ];
    const single: GapItem[] = [{ id: "G1", dimension: "Depth", description: "d" }];
    const result = aggregateManifestResolution(single, allCeilingResolved);
    expect(result.closableCount).toBe(0);
    expect(result.resolution).toBe(0);
  });
});
