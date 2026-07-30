// Shared descriptive statistics used by the reports and monitors. Kept in one
// place so the score-shift report and the validity monitors cannot drift into
// two subtly different definitions of the same quantity.

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Pearson product-moment correlation. Returns null when it is undefined
// rather than NaN: fewer than 2 pairs, or zero variance in either series
// (a flat series has no direction to correlate with).
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;

  const meanX = xs.slice(0, n).reduce((sum, v) => sum + v, 0) / n;
  const meanY = ys.slice(0, n).reduce((sum, v) => sum + v, 0) / n;

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

  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}
