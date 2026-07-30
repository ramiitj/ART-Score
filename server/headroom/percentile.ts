export interface PercentileResult {
  percentile: number; // 0-100: this score beat this % of the reference pool
  sampleSize: number;
  sufficientData: boolean;
}

// Conventional minimum-N rule of thumb for a stated percentile to be shown at
// all (not a fitted/calibrated constant) — below this, the reference pool is
// too small for the statistic to mean anything.
export const MIN_PERCENTILE_SAMPLE_SIZE = 20;

// Nonparametric percentile rank: no distributional assumption, no calibration
// constant. Ties are counted as half-below (standard mid-rank convention),
// so a score tied with the whole pool lands at the 50th percentile rather
// than being arbitrarily placed above or below.
export function computePercentile(score: number, referenceScores: number[]): PercentileResult {
  const sampleSize = referenceScores.length;
  if (sampleSize === 0) {
    return { percentile: 0, sampleSize, sufficientData: false };
  }

  const countBelow = referenceScores.filter(s => s < score).length;
  const countEqual = referenceScores.filter(s => s === score).length;
  const percentile = ((countBelow + 0.5 * countEqual) / sampleSize) * 100;

  return {
    percentile: Math.round(percentile * 10) / 10,
    sampleSize,
    sufficientData: sampleSize >= MIN_PERCENTILE_SAMPLE_SIZE
  };
}
