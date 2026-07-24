import type { PairedComparisonResult, ManifestResolutionResult } from "./types";

export interface HeadroomShadowResult {
  resolution: number;
  closableCount: number;
  resolvedCount: number;
  validityGatePassed: boolean;
  pSteered: number;
  btLogOdds: number;
  disagreement: boolean;
  // Resolution-gated by the paired-comparison validity gate: if the steered
  // output does not reliably beat the self-revised ceiling in blind
  // comparison, there is no elevation to credit regardless of manifest
  // resolution (paper: "no elevation to measure" below the gate).
  //
  // NOTE: this is a Resolution-only proxy for the new Headroom score, not the
  // final Efficiency+Resolution composite from the migration spec (§7). The
  // Efficiency term needs a natural edit-distance signal, which only exists
  // once the direct-prompt-edit interaction lands (migration Phase 3) — it is
  // deliberately not approximated here under the old revision-instructions
  // interaction model.
  headroomScoreShadow: number;
}

export function computeHeadroomShadow(
  paired: PairedComparisonResult,
  manifest: ManifestResolutionResult
): HeadroomShadowResult {
  return {
    resolution: manifest.resolution,
    closableCount: manifest.closableCount,
    resolvedCount: manifest.resolvedCount,
    validityGatePassed: paired.validityGatePassed,
    pSteered: paired.pSteered,
    btLogOdds: paired.btLogOdds,
    disagreement: paired.disagreement,
    headroomScoreShadow: paired.validityGatePassed ? manifest.resolution : 0
  };
}
