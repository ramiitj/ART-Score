// Evaluation claim/lock decision (docs/HEADROOM_MIGRATION_SPEC.md).
//
// A session must be evaluated exactly once, but a *failed* evaluation must
// stay retryable. The original two-state design ("active" -> "completed",
// flipped before scoring began) achieved the first at the cost of the second:
// any judge failure left the session permanently locked, so the error
// screen's Retry button hit a 409 and its "your submission was not lost"
// message was untrue.
//
// Three states fix both:
//   active    -- never evaluated, or a previous attempt failed. Claimable.
//   scoring   -- an evaluation is in flight. Claimable again only after it
//                has clearly died (STALE_SCORING_CLAIM_MS), so a crashed
//                request cannot strand the session forever.
//   completed -- genuinely scored. Never claimable again.
//
// The caller sets "scoring" before doing the work, "completed" on success,
// and back to "active" on failure.

// How long a "scoring" claim is honoured before it is treated as abandoned.
// Comfortably longer than a full evaluation (one executor call plus two
// 3-pass blind judge comparisons), short enough that a crash does not strand
// someone for long.
export const STALE_SCORING_CLAIM_MS = 3 * 60 * 1000;

export type SessionStatus = "active" | "scoring" | "completed" | string;

export interface ClaimDecision {
  claimable: boolean;
  // Set when claimable is false: the message to return with a 409.
  reason?: string;
}

export function decideEvaluationClaim(
  status: SessionStatus,
  scoringStartedAt: string | null | undefined,
  now: Date = new Date()
): ClaimDecision {
  if (status === "completed") {
    return { claimable: false, reason: "This session has already been evaluated." };
  }

  if (status === "scoring") {
    const startedMs = scoringStartedAt ? new Date(scoringStartedAt).getTime() : NaN;
    // An unparseable or missing timestamp means we cannot tell how old the
    // claim is; treat it as stale and reclaimable rather than stranding the
    // session permanently.
    if (Number.isNaN(startedMs) || now.getTime() - startedMs > STALE_SCORING_CLAIM_MS) {
      return { claimable: true };
    }
    return { claimable: false, reason: "An evaluation for this session is already in progress. Please wait a moment." };
  }

  // "active", plus any legacy/unknown status, is claimable.
  return { claimable: true };
}
