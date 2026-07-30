// Aggregates the N items in a multi-item test run (docs/HEADROOM_MIGRATION_SPEC.md
// §11) into a single reportable result: mean +/- standard error across items,
// computed only from items whose individual attempt is `comparable` -- the
// same gate already used for the leaderboard and percentile endpoints, so a
// run's aggregate never mixes in a static-fallback, judge-unstable, or
// injection-flagged item.

export interface RunItemResult {
  sessionId: string;
  domain: string;
  difficulty: string;
  score: number;
  headroomScoreShadow: number | null;
  comparable: boolean;
  status: "completed" | "scoring_pending" | "rejected";
}

export interface RunAggregate {
  itemsTotal: number;
  itemsCompleted: number;
  allItemsCompleted: boolean;
  meanScore: number | null;
  scoreSE: number | null;
  meanHeadroomShadow: number | null;
  headroomShadowSE: number | null;
  items: RunItemResult[];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Sample standard error of the mean. Undefined (returned as null) below n=2 --
// a single value has no estimable spread.
function standardError(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance / values.length);
}

export function aggregateRunResults(itemsTotal: number, items: RunItemResult[]): RunAggregate {
  const completedItems = items.filter(i => i.status === "completed");
  const comparableItems = completedItems.filter(i => i.comparable);

  const scores = comparableItems.map(i => i.score);
  const shadowScores = comparableItems
    .map(i => i.headroomScoreShadow)
    .filter((v): v is number => typeof v === "number");

  return {
    itemsTotal,
    itemsCompleted: completedItems.length,
    allItemsCompleted: completedItems.length >= itemsTotal,
    meanScore: mean(scores),
    scoreSE: standardError(scores),
    meanHeadroomShadow: mean(shadowScores),
    headroomShadowSE: standardError(shadowScores),
    items
  };
}
