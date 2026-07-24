// Judge/executor model re-equating (docs/HEADROOM_MIGRATION_SPEC.md §16.5).
//
// Scores from different pinned model eras are not directly comparable: a
// judge or executor model upgrade can shift the scale itself, independent of
// any real change in Headroom. The paper's anchor-item design resolves this
// by scoring a shared set of items once under the old pinned model and once
// under the new one, then equating on the resulting offset -- this module is
// the pure math for that step. Producing the anchor pairs is a deliberate,
// offline calibration exercise (see scripts/judge-reequate.ts); this file
// only computes the offset from pairs already collected.

export interface AnchorItemPair {
  itemId: string;
  oldModelScore: number;
  newModelScore: number;
}

export interface EquatingResult {
  offset: number;
  n: number;
  sufficientAnchors: boolean;
}

// Below this many anchor items, an offset is illustrative only -- too few
// pairs to distinguish a real scale shift from item-level noise.
export const MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING = 5;

export function computeEquatingOffset(pairs: AnchorItemPair[]): EquatingResult | null {
  if (pairs.length === 0) return null;

  const diffs = pairs.map(p => p.newModelScore - p.oldModelScore);
  const offset = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;

  return {
    offset,
    n: pairs.length,
    sufficientAnchors: pairs.length >= MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING
  };
}

// Shifts an old-model-era score onto the current model's scale.
export function applyEquatingOffset(oldEraScore: number, equating: EquatingResult): number {
  return oldEraScore + equating.offset;
}
