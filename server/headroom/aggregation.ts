import type { AggregatedScore, JudgePassResult } from "./types";

// Calculate median of three numbers
export function medianOfThree(a: number, b: number, c: number): number {
  return [a, b, c].sort((x, y) => x - y)[1];
}

// Aggregate three judge passes into medians, total, and per-dimension spreads.
// Returns null if fewer than 3 valid passes were provided (triggers pending scoring path upstream).
export function aggregatePasses(validPasses: JudgePassResult[]): AggregatedScore | null {
  if (validPasses.length < 3) {
    return null;
  }

  const p1 = validPasses[0];
  const p2 = validPasses[1];
  const p3 = validPasses[2];

  const clarity = medianOfThree(p1.clarityScore, p2.clarityScore, p3.clarityScore);
  const depth = medianOfThree(p1.depthScore, p2.depthScore, p3.depthScore);
  const structure = medianOfThree(p1.structureScore, p2.structureScore, p3.structureScore);
  const actionability = medianOfThree(p1.actionabilityScore, p2.actionabilityScore, p3.actionabilityScore);
  const domainScore = medianOfThree(p1.domainScore, p2.domainScore, p3.domainScore);

  const claritySpread = Math.max(p1.clarityScore, p2.clarityScore, p3.clarityScore) - Math.min(p1.clarityScore, p2.clarityScore, p3.clarityScore);
  const depthSpread = Math.max(p1.depthScore, p2.depthScore, p3.depthScore) - Math.min(p1.depthScore, p2.depthScore, p3.depthScore);
  const structureSpread = Math.max(p1.structureScore, p2.structureScore, p3.structureScore) - Math.min(p1.structureScore, p2.structureScore, p3.structureScore);
  const actionabilitySpread = Math.max(p1.actionabilityScore, p2.actionabilityScore, p3.actionabilityScore) - Math.min(p1.actionabilityScore, p2.actionabilityScore, p3.actionabilityScore);
  const domainSpread = Math.max(p1.domainScore, p2.domainScore, p3.domainScore) - Math.min(p1.domainScore, p2.domainScore, p3.domainScore);

  const spread = Math.max(claritySpread, depthSpread, structureSpread, actionabilitySpread, domainSpread);

  return {
    medians: { clarity, depth, structure, actionability, domain: domainScore },
    total: clarity + depth + structure + actionability + domainScore,
    spread,
    passes: validPasses,
    dimensionSpreads: {
      clarity: claritySpread,
      depth: depthSpread,
      structure: structureSpread,
      actionability: actionabilitySpread,
      domain: domainSpread
    }
  };
}
