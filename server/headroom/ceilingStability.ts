import type { PairedComparisonResult } from "./types";

// Self-revised ceiling stability check (docs/HEADROOM_MIGRATION_SPEC.md §8):
// "run Bsr twice; if the two ceilings' paired comparison is a coin-flip,
// ceiling is stable; if one dominates, take the stronger (the ceiling must
// be the model's *best* self-revision) and record selfRevisedSpread."
//
// Two independent self-revisions (A and B) of the same baseline are blind-
// compared via judgePairedComparison(ai, task, A, B) -- reusing that
// function's existing 3-pass, position-randomized comparison exactly as it
// compares any two outputs. A mixed/split result (disagreement=true) means
// neither revision reliably beats the other -- the ceiling is reproducible
// regardless of which one is used. A unanimous result means one revision is
// genuinely stronger, and the ceiling must be anchored on that one (the
// paper: crediting a person against a weak, arbitrary self-revision would
// understate their real headroom).
export interface CeilingStabilityResult {
  stable: boolean;
  // Which of the two self-revisions to use as the ceiling. null when
  // stable=true, since either is equally valid.
  strongerOutput: "A" | "B" | null;
}

export function assessCeilingStability(paired: PairedComparisonResult): CeilingStabilityResult {
  if (paired.disagreement) {
    return { stable: true, strongerOutput: null };
  }
  const bDominates = paired.steeredWins === paired.passCount;
  return { stable: false, strongerOutput: bDominates ? "B" : "A" };
}
