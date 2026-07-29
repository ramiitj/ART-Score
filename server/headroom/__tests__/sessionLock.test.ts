import { describe, it, expect } from "vitest";
import { decideEvaluationClaim, STALE_SCORING_CLAIM_MS } from "../sessionLock";

const NOW = new Date("2026-01-01T12:00:00.000Z");

function agoMs(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}

describe("decideEvaluationClaim", () => {
  it("allows claiming an active session", () => {
    expect(decideEvaluationClaim("active", null, NOW).claimable).toBe(true);
  });

  it("refuses a completed session as a genuine duplicate", () => {
    const decision = decideEvaluationClaim("completed", null, NOW);
    expect(decision.claimable).toBe(false);
    expect(decision.reason).toMatch(/already been evaluated/i);
  });

  it("refuses a scoring claim that is still fresh (concurrent double-submit)", () => {
    const decision = decideEvaluationClaim("scoring", agoMs(5_000), NOW);
    expect(decision.claimable).toBe(false);
    expect(decision.reason).toMatch(/in progress/i);
  });

  it("allows reclaiming a scoring session once the claim has gone stale", () => {
    const decision = decideEvaluationClaim("scoring", agoMs(STALE_SCORING_CLAIM_MS + 1_000), NOW);
    expect(decision.claimable).toBe(true);
  });

  it("treats a scoring claim with a missing timestamp as stale rather than stranding the session", () => {
    expect(decideEvaluationClaim("scoring", null, NOW).claimable).toBe(true);
  });

  it("treats a scoring claim with an unparseable timestamp as stale", () => {
    expect(decideEvaluationClaim("scoring", "not-a-date", NOW).claimable).toBe(true);
  });

  it("allows claiming a session with an unknown/legacy status", () => {
    expect(decideEvaluationClaim("some-legacy-status", null, NOW).claimable).toBe(true);
  });

  it("is exactly at the boundary: a claim aged exactly the stale threshold is still held", () => {
    const decision = decideEvaluationClaim("scoring", agoMs(STALE_SCORING_CLAIM_MS), NOW);
    expect(decision.claimable).toBe(false);
  });
});
