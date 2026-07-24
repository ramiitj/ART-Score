// Per-process daily cap on expensive Gemini-backed session creation
// (/api/generate-task), guarding against cost blowouts from abuse, retry
// storms, or unexpectedly heavy legitimate traffic. This is a single-process
// guard, not a distributed one -- a restart resets the counter -- which is
// the appropriate tradeoff for a single-instance deployment; a distributed
// cap would need a shared store (Firestore counter, Redis) instead.
export interface DailyCapState {
  date: string; // YYYY-MM-DD
  count: number;
}

// Default ceiling on new sessions per day. A documented, adjustable safety
// valve, not a calibrated constant -- tune via the DAILY_GENERATION_CAP env
// var per deployment.
export const DEFAULT_DAILY_GENERATION_CAP = 500;

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function checkAndIncrementCap(
  state: DailyCapState,
  cap: number,
  nowIso: string
): { allowed: boolean; state: DailyCapState } {
  const today = dateKey(nowIso);
  const currentCount = state.date === today ? state.count : 0;

  if (currentCount >= cap) {
    return { allowed: false, state: { date: today, count: currentCount } };
  }

  return { allowed: true, state: { date: today, count: currentCount + 1 } };
}
