export interface VarianceDecompositionRecord {
  personKey: string;
  itemKey: string;
  value: number;
}

export interface OneWayVarianceShare {
  groupCount: number;
  varianceShare: number; // SS_between / SS_total, in [0,1]; 0 if SS_total is 0
}

export interface VarianceDecompositionResult {
  totalN: number;
  uniquePersons: number;
  uniqueItems: number;
  personsWithRepeatedAttempts: number;
  personVariance: OneWayVarianceShare;
  itemVariance: OneWayVarianceShare;
  sufficientRepeatedMeasures: boolean;
}

// Minimum number of persons with 2+ attempts (across different items) for the
// person-variance estimate to be trustworthy rather than confounded with
// single-item noise. A conventional threshold for a first read, not a fitted
// constant — see docs/HEADROOM_MIGRATION_SPEC.md §11 and §15.
export const MIN_REPEATED_PERSONS_FOR_RELIABLE_ESTIMATE = 20;

function oneWayVarianceShare(
  records: VarianceDecompositionRecord[],
  keyOf: (r: VarianceDecompositionRecord) => string
): OneWayVarianceShare {
  const groups = new Map<string, number[]>();
  for (const r of records) {
    const k = keyOf(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r.value);
  }

  const allValues = records.map(r => r.value);
  const n = allValues.length;
  if (n === 0) return { groupCount: 0, varianceShare: 0 };

  const grandMean = allValues.reduce((a, b) => a + b, 0) / n;
  const ssTotal = allValues.reduce((acc, v) => acc + (v - grandMean) ** 2, 0);

  let ssBetween = 0;
  for (const vals of groups.values()) {
    const groupMean = vals.reduce((a, b) => a + b, 0) / vals.length;
    ssBetween += vals.length * (groupMean - grandMean) ** 2;
  }

  return {
    groupCount: groups.size,
    varianceShare: ssTotal === 0 ? 0 : ssBetween / ssTotal
  };
}

// Two separate one-way decompositions (person, item) rather than a full
// two-way ANOVA with an interaction term: real attempts are unbalanced and
// mostly unreplicated per person x item cell, so an interaction term isn't
// reliably estimable yet. This is the falsification check from the migration
// spec (§15): "A measure separating tasks but not persons would reveal an
// instrument capturing item difficulty rather than a human capacity."
export function decomposeVariance(records: VarianceDecompositionRecord[]): VarianceDecompositionResult {
  const personCounts = new Map<string, number>();
  const itemKeys = new Set<string>();
  for (const r of records) {
    personCounts.set(r.personKey, (personCounts.get(r.personKey) || 0) + 1);
    itemKeys.add(r.itemKey);
  }

  const personsWithRepeatedAttempts = [...personCounts.values()].filter(c => c >= 2).length;

  return {
    totalN: records.length,
    uniquePersons: personCounts.size,
    uniqueItems: itemKeys.size,
    personsWithRepeatedAttempts,
    personVariance: oneWayVarianceShare(records, r => r.personKey),
    itemVariance: oneWayVarianceShare(records, r => r.itemKey),
    sufficientRepeatedMeasures: personsWithRepeatedAttempts >= MIN_REPEATED_PERSONS_FOR_RELIABLE_ESTIMATE
  };
}
