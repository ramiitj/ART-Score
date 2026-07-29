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
  // This is the DECIDED score shape, not an interim proxy: HeadroomScore = R,
  // gated (docs/HEADROOM_MIGRATION_SPEC.md §7, §16.2). The Efficiency term
  // from the original spec was dropped — R plus the validity gate carry the
  // construct validity, while E added a gameable, unitless second dimension
  // that depended on an uncalibratable constant. Edit magnitude is still
  // logged, but as an input to the verbosity-leakage validity monitor (§13)
  // rather than to the score.
  //
  // Consequence: cutting this over no longer waits on any calibration
  // constant — only on real-data evidence that the instrument behaves.
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
