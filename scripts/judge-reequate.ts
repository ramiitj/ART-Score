// Ad-hoc analysis tool: computes the judge/executor model re-equating offset
// described in docs/HEADROOM_MIGRATION_SPEC.md §16.5, from a set of
// anchor-item score pairs -- the SAME item scored once under the previously
// pinned model(s) and once under the currently pinned one.
//
// Producing the anchor pairs is a deliberate, offline calibration exercise:
// pick a shared set of items (ideally from the calibrated item bank, §6),
// re-run each through the Judge/Executor once per model era, and record the
// resulting scores. This does not happen automatically in the attempts
// stream, since every /api/generate-task call produces a genuinely distinct
// generated task -- there is no naturally recurring item to equate on until
// an item bank exists.
//
// Usage:
//   npx tsx scripts/judge-reequate.ts path/to/anchor-pairs.json
//
// The input file must be a JSON array of { itemId, oldModelScore,
// newModelScore } objects, or an object of the form { pairs: [...] }.

import { readFileSync } from "fs";
import { computeEquatingOffset, MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING } from "../server/headroom/reequating";
import type { AnchorItemPair } from "../server/headroom/reequating";

export function loadAnchorPairs(filePath: string): AnchorItemPair[] {
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.pairs)) return raw.pairs;
  throw new Error("Expected a JSON array of {itemId, oldModelScore, newModelScore} pairs, or { pairs: [...] }.");
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/judge-reequate.ts <anchor-pairs.json>");
    process.exit(1);
  }

  const pairs = loadAnchorPairs(filePath);
  const result = computeEquatingOffset(pairs);

  if (!result) {
    console.log("No anchor-item pairs found in export -- cannot compute an equating offset.");
    return;
  }

  console.log("=== Judge/Executor Model Re-Equating ===");
  console.log(`Anchor items analyzed: ${result.n}`);
  console.log(`Equating offset (new-model scale minus old-model scale): ${result.offset.toFixed(2)}`);
  console.log("");

  if (!result.sufficientAnchors) {
    console.log(
      `WARNING: fewer than ${MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING} anchor items ` +
      `(${result.n}) -- this offset is illustrative only, not a reliable equating ` +
      "constant. Re-run a larger shared item set through both model eras before " +
      "applying this offset to historical scores."
    );
  } else {
    console.log(
      "Add this offset to historical (old-model-era) scores to bring them onto " +
      "the current model's scale before comparing across the model transition."
    );
  }
}

// Only run when executed directly (npx tsx scripts/judge-reequate.ts), not
// when loadAnchorPairs is imported for unit testing.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
