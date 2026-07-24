// Standing validity monitors (docs/HEADROOM_MIGRATION_SPEC.md §13): live
// checks against the paper's falsifiability conditions, meant to run on an
// ongoing basis rather than as one-off studies.

// --- Elevation monitor ---------------------------------------------------
//
// "Ongoing rate at which steered beats self-revised in blind paired
// comparison across people/domains. If this drops to chance, the construct
// is empty -- surface it."

export const MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR = 20;

// Mean pSteered at or below this is treated as indistinguishable from chance
// (0.5) rather than requiring a full significance test -- deliberately
// conservative so the monitor flags early rather than only on total collapse.
const ELEVATION_CHANCE_THRESHOLD = 0.55;

export interface ElevationMonitorResult {
  n: number;
  meanPSteered: number | null;
  sufficientSample: boolean;
  atOrNearChance: boolean;
}

export function computeElevationMonitor(pSteeredValues: number[]): ElevationMonitorResult {
  if (pSteeredValues.length === 0) {
    return { n: 0, meanPSteered: null, sufficientSample: false, atOrNearChance: false };
  }

  const mean = pSteeredValues.reduce((sum, v) => sum + v, 0) / pSteeredValues.length;
  const sufficientSample = pSteeredValues.length >= MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR;

  return {
    n: pSteeredValues.length,
    meanPSteered: mean,
    sufficientSample,
    // Only meaningful once there's enough sample to distinguish real chance
    // performance from noise -- an early, small sample sitting near 0.5 is
    // not yet evidence of anything.
    atOrNearChance: sufficientSample && mean <= ELEVATION_CHANCE_THRESHOLD
  };
}

// --- Obsolescence monitor -------------------------------------------------
//
// "Track mean Headroom over model generations; if a model upgrade collapses
// Headroom toward zero, the instrument should record its own obsolescence
// (continual learning solved) rather than hide it."

export const MIN_SAMPLE_SIZE_PER_ERA = 20;
const NEAR_ZERO_HEADROOM_THRESHOLD = 0.1;
const MEANINGFUL_HEADROOM_THRESHOLD = 0.2;

export interface ModelEraRecord {
  model: string;
  headroomScoreShadow: number;
  timestamp: string;
}

export interface ModelEraHeadroom {
  model: string;
  n: number;
  meanHeadroomShadow: number;
  earliestTimestamp: string;
}

export interface ObsolescenceMonitorResult {
  eras: ModelEraHeadroom[];
  possibleObsolescence: boolean;
}

export function computeObsolescenceMonitor(records: ModelEraRecord[]): ObsolescenceMonitorResult {
  const byModel = new Map<string, { scores: number[]; earliestTimestamp: string }>();

  for (const r of records) {
    const bucket = byModel.get(r.model);
    if (bucket) {
      bucket.scores.push(r.headroomScoreShadow);
      if (r.timestamp < bucket.earliestTimestamp) bucket.earliestTimestamp = r.timestamp;
    } else {
      byModel.set(r.model, { scores: [r.headroomScoreShadow], earliestTimestamp: r.timestamp });
    }
  }

  const eras: ModelEraHeadroom[] = Array.from(byModel.entries())
    .map(([model, bucket]) => ({
      model,
      n: bucket.scores.length,
      meanHeadroomShadow: bucket.scores.reduce((sum, v) => sum + v, 0) / bucket.scores.length,
      earliestTimestamp: bucket.earliestTimestamp
    }))
    .sort((a, b) => a.earliestTimestamp.localeCompare(b.earliestTimestamp));

  const sufficientEras = eras.filter(e => e.n >= MIN_SAMPLE_SIZE_PER_ERA);

  let possibleObsolescence = false;
  if (sufficientEras.length >= 2) {
    const latest = sufficientEras[sufficientEras.length - 1];
    const priorMax = Math.max(...sufficientEras.slice(0, -1).map(e => e.meanHeadroomShadow));
    possibleObsolescence = latest.meanHeadroomShadow <= NEAR_ZERO_HEADROOM_THRESHOLD && priorMax >= MEANINGFUL_HEADROOM_THRESHOLD;
  }

  return { eras, possibleObsolescence };
}
