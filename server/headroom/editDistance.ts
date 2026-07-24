// Edit-distance signal (docs/HEADROOM_MIGRATION_SPEC.md §7): the natural
// "how much did the person change" measure the Efficiency term needs.
// headroomShadow.ts's Resolution-only proxy was originally left without an
// Efficiency term because, at Phase 2, the interaction model was still
// free-form revision instructions rather than a direct edit of the baseline
// prompt -- there was no natural edit to measure. Phase 3 replaced that with
// direct prompt editing, so the signal now exists; this module computes it.
//
// This does NOT compute the final Efficiency score -- that still needs
// K_EFFICIENCY pinned from real pilot data (§16.2), which does not exist
// yet. This only logs editDistance/editDistanceNorm now so that future
// calibration has the raw signal to work from, rather than only starting to
// collect it once someone remembers to.

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function wordLevenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export interface EditDistanceResult {
  editDistance: number; // word-level Levenshtein distance, baselinePrompt -> editedPrompt
  editDistanceNorm: number; // editDistance / baseline word count, clamped to [0,1]
}

export function computeEditDistance(baselinePrompt: string, editedPrompt: string): EditDistanceResult {
  const baseWords = tokenize(baselinePrompt);
  const editedWords = tokenize(editedPrompt);
  const editDistance = wordLevenshtein(baseWords, editedWords);
  const editDistanceNorm = baseWords.length === 0 ? 0 : clamp01(editDistance / baseWords.length);
  return { editDistance, editDistanceNorm };
}
