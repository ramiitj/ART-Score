import type { AggregatedScore, JudgePassResult } from "./types";

// Calculate median of three numbers
export function medianOfThree(a: number, b: number, c: number): number {
  return [a, b, c].sort((x, y) => x - y)[1];
}

// Median over any number of passes. With a single pass this is just that
// pass's value, which is the normal case now that the absolute scorer runs
// one pass (see ABSOLUTE_JUDGE_PASS_COUNT in constants.ts).
function median(values: number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function spreadOf(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

// Aggregate N judge passes into medians, total, and per-dimension spreads.
// Returns null only when there are no valid passes at all (triggers the
// pending/error path upstream).
//
// NOTE on spread: with a single pass every spread is 0 by construction, so
// the `judgeUnstable = spread > 4` comparability gate cannot fire. That gate
// was already close to inert -- the passes it measured were identical calls
// (same prompt, temperature 0, topP 1), so they disagreed only through
// serving-level nondeterminism. The meaningful instability signal is the new
// judge's `disagreement` flag, where position IS randomized per pass and
// disagreement is real information about the item (spec §5.1).
export function aggregatePasses(validPasses: JudgePassResult[]): AggregatedScore | null {
  if (validPasses.length === 0) {
    return null;
  }

  const clarityScores = validPasses.map(p => p.clarityScore);
  const depthScores = validPasses.map(p => p.depthScore);
  const structureScores = validPasses.map(p => p.structureScore);
  const actionabilityScores = validPasses.map(p => p.actionabilityScore);
  const domainScores = validPasses.map(p => p.domainScore);

  const clarity = median(clarityScores);
  const depth = median(depthScores);
  const structure = median(structureScores);
  const actionability = median(actionabilityScores);
  const domainScore = median(domainScores);

  const claritySpread = spreadOf(clarityScores);
  const depthSpread = spreadOf(depthScores);
  const structureSpread = spreadOf(structureScores);
  const actionabilitySpread = spreadOf(actionabilityScores);
  const domainSpread = spreadOf(domainScores);

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
