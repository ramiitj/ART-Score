// Regression harness math (docs/HEADROOM_MIGRATION_SPEC.md §15): compares the
// legacy composite score against the new-architecture headroomShadow score
// across the same set of real attempts, so the score-shift can be published
// before Phase 4 cutover rather than assumed.

export interface ScoreShiftRecord {
  oldScore: number; // legacy composite, 0-100
  newScoreShadow: number; // headroomShadow.headroomScoreShadow, 0-1
  validityGatePassed: boolean;
}

export interface ScoreShiftReport {
  n: number;
  meanOldScore: number | null;
  meanNewScore: number | null; // scaled to 0-100 for direct comparison with oldScore
  meanDiff: number | null; // meanNewScore - meanOldScore
  correlation: number | null; // Pearson r between old and new scores (both on 0-100 scale)
  gatePassedCount: number;
  gateFailedCount: number;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;

  const meanX = xs.reduce((sum, v) => sum + v, 0) / n;
  const meanY = ys.reduce((sum, v) => sum + v, 0) / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  if (varX === 0 || varY === 0) return null; // no variance in one series -- correlation undefined
  return cov / Math.sqrt(varX * varY);
}

export function computeScoreShiftReport(records: ScoreShiftRecord[]): ScoreShiftReport {
  const oldScores = records.map(r => r.oldScore);
  const newScores = records.map(r => r.newScoreShadow * 100);

  const gatePassedCount = records.filter(r => r.validityGatePassed).length;
  const gateFailedCount = records.length - gatePassedCount;

  const meanOldScore = mean(oldScores);
  const meanNewScore = mean(newScores);

  return {
    n: records.length,
    meanOldScore,
    meanNewScore,
    meanDiff: meanOldScore !== null && meanNewScore !== null ? meanNewScore - meanOldScore : null,
    correlation: pearsonCorrelation(oldScores, newScores),
    gatePassedCount,
    gateFailedCount
  };
}
