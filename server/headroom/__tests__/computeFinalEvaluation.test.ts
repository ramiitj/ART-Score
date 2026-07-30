import crypto from "crypto";
import { describe, it, expect } from "vitest";
import { computeFinalEvaluation } from "../computeFinalEvaluation";
import { aggregatePasses } from "../aggregation";
import { MASTER_SYSTEM_PROMPT, EXECUTOR_MODEL } from "../constants";
import type { JudgePassResult } from "../types";

function makePass(overrides: Partial<JudgePassResult> = {}): JudgePassResult {
  return {
    clarityScore: 14,
    clarityRationale: "clarity rationale",
    depthScore: 14,
    depthRationale: "depth rationale",
    structureScore: 14,
    structureRationale: "structure rationale",
    actionabilityScore: 14,
    actionabilityRationale: "actionability rationale",
    domainScore: 14,
    domainRationale: "domain rationale",
    strengths: [],
    insight: "overall insight",
    diffInventory: [],
    selfChecks: "self checks",
    confidence: "high",
    integrityViolation: false,
    ...overrides
  };
}

function baseSession(overrides: Partial<any> = {}) {
  return {
    baseline: "This is a plain baseline paragraph with several distinct words used for testing purposes today.",
    baselineQualityScore: 50,
    headroom: 50,
    baselineSpread: 0,
    baselineBandWide: false,
    generationModelUsed: EXECUTOR_MODEL,
    executorModel: EXECUTOR_MODEL,
    timeLimit: 90,
    rubricVersionId: "v1.0.0",
    systemPrompt: MASTER_SYSTEM_PROMPT,
    ...overrides
  };
}

const PLAIN_REVISION = "This is a plain revision paragraph with several distinct words describing the improved task outcome.";

describe("computeFinalEvaluation — normal path", () => {
  it("scores as round(headroomEfficiency) with no guardrails when dims sum to a moderate total", () => {
    // 5 dims x 14 = 70 total; baseline 50 -> rawDelta 20, clampedHeadroom 50 -> headroomEff 40
    const passes = [makePass(), makePass(), makePass()];
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession();

    const result = computeFinalEvaluation(session, scoreResult, "improved output text", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(40);
    expect(result.headroomEfficiencyScore).toBe(40);
    expect(result.rawDeltaScore).toBe(20);
    expect(result.triageFlags.guardrailFired).toBe(false);
    expect(result.triageFlags.capApplied).toBe(0);
    expect(result.comparable).toBe(true);
    expect(result.judgeUnstable).toBe(false);
    expect(result.timeExceeded).toBe(false);

    const expectedHash = crypto.createHash("sha256").update(session.systemPrompt).digest("hex");
    expect(result.judgeMetadata.promptHash).toBe(expectedHash);
  });
});

describe("computeFinalEvaluation — single-pass scoring", () => {
  it("works with one pass, which is how the absolute scorer now runs", () => {
    // Regression guard: this function used to index passes[0..2] directly and
    // threw on a single-pass score result.
    const scoreResult = aggregatePasses([makePass()])!;
    const result = computeFinalEvaluation(baseSession(), scoreResult, "improved output", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(40);
    expect(result.rawDeltaScore).toBe(20);
    expect(result.insight).toBe("overall insight");
    expect(result.judgeUnstable).toBe(false); // spread is 0 by construction with one pass
  });
});

describe("computeFinalEvaluation — C1 Integrity Violation guardrail", () => {
  it("zeroes the score when the ruling pass confirms an integrity violation, overriding an otherwise high score", () => {
    // 5 dims x 20 = 100 -> pre-guardrail finalScore would be 100.
    const maxPass = makePass({
      clarityScore: 20, depthScore: 20, structureScore: 20, actionabilityScore: 20, domainScore: 20,
      integrityViolation: true
    });
    const scoreResult = aggregatePasses([maxPass, maxPass, maxPass])!;
    const session = baseSession();

    const result = computeFinalEvaluation(session, scoreResult, "improved output", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(0);
    expect(result.triageFlags.guardrailFired).toBe(true);
    expect(result.triageFlags.capApplied).toBe(0);
    expect(result.triageFlags.reason).toMatch(/Integrity Violation/);
    expect(result.integrityViolation).toBe(true);
    expect(result.comparable).toBe(false);
  });

  it("does not fire when the regex scan alone is suspicious but the model does not confirm it", () => {
    // regexInjectionSuspected=true (6th arg) but integrityViolation stays false on every pass:
    // the score itself must not be zeroed, only comparable is affected (regex stays advisory).
    const passes = [makePass(), makePass(), makePass()]; // total 70 -> pre-cap finalScore 40
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession();

    const result = computeFinalEvaluation(session, scoreResult, "improved output", PLAIN_REVISION, 30, true);

    expect(result.score).toBe(40);
    expect(result.triageFlags.guardrailFired).toBe(false);
    expect(result.integrityViolation).toBe(false);
    expect(result.comparable).toBe(false); // still excluded from comparable, just not zeroed
  });
});

describe("computeFinalEvaluation — C2 Formatting Fallacy guardrail", () => {
  it("caps to 25 when markdown is added without word-count growth, on an otherwise high score", () => {
    const passes = [makePass(), makePass(), makePass()]; // total 70 -> pre-cap finalScore 40
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession(); // plain baseline, 0 markdown markers

    const markdownRevision = "# Title\n* Point one\n* Point two\n* Point three";
    const result = computeFinalEvaluation(session, scoreResult, "improved output", markdownRevision, 30, false);

    expect(result.score).toBe(25);
    expect(result.triageFlags.guardrailFired).toBe(true);
    expect(result.triageFlags.capApplied).toBe(25);
    expect(result.triageFlags.reason).toMatch(/Formatting Fallacy/);
  });
});

describe("computeFinalEvaluation — C3 Cosmetic Changes Only guardrail", () => {
  it("caps to 20 when the diff inventory has cosmetic changes but no substantive ones", () => {
    const passes = [
      makePass({ diffInventory: [{ changeDescription: "reworded a sentence", classification: "COSMETIC" }] }),
      makePass({ diffInventory: [{ changeDescription: "reworded a sentence", classification: "COSMETIC" }] }),
      makePass({ diffInventory: [{ changeDescription: "reworded a sentence", classification: "COSMETIC" }] })
    ];
    const scoreResult = aggregatePasses(passes)!; // total 70 -> pre-cap finalScore 40
    const session = baseSession();

    const result = computeFinalEvaluation(session, scoreResult, "improved output", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(20);
    expect(result.triageFlags.guardrailFired).toBe(true);
    expect(result.triageFlags.capApplied).toBe(20);
    expect(result.triageFlags.reason).toMatch(/Cosmetic Changes Only/);
  });
});

describe("computeFinalEvaluation — C4 Premium Threshold guardrail", () => {
  it("caps to 74 when the score would clear 75 with fewer than 2 substantive diffs", () => {
    // 5 dims x 20 = 100 total; baseline 50 -> rawDelta 50, clampedHeadroom 50 -> headroomEff 100 -> pre-cap finalScore 100
    const maxPass = makePass({
      clarityScore: 20, depthScore: 20, structureScore: 20, actionabilityScore: 20, domainScore: 20,
      diffInventory: [{ changeDescription: "one substantive change", classification: "SUBSTANTIVE" }]
    });
    const scoreResult = aggregatePasses([maxPass, maxPass, maxPass])!;
    const session = baseSession();

    const result = computeFinalEvaluation(session, scoreResult, "improved output", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(74);
    expect(result.triageFlags.guardrailFired).toBe(true);
    expect(result.triageFlags.capApplied).toBe(74);
    expect(result.triageFlags.reason).toMatch(/Premium Threshold Missed/);
  });
});

describe("computeFinalEvaluation — C5 Negative Diff guardrail", () => {
  it("caps to 55 and clamps the domain dimension score to 10 when a negative diff is present", () => {
    // dims sum to 76; baseline 40, clampedHeadroom 60 -> rawDelta 36 -> headroomEff 60 -> pre-cap finalScore 60
    const negPass = makePass({
      clarityScore: 16, depthScore: 16, structureScore: 16, actionabilityScore: 14, domainScore: 14,
      diffInventory: [
        { changeDescription: "introduced an unverified claim", classification: "NEGATIVE" },
        { changeDescription: "added real detail", classification: "SUBSTANTIVE" }
      ]
    });
    const scoreResult = aggregatePasses([negPass, negPass, negPass])!;
    const session = baseSession({ baselineQualityScore: 40, headroom: 60 });

    const result = computeFinalEvaluation(session, scoreResult, "improved output", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(55);
    expect(result.triageFlags.guardrailFired).toBe(true);
    expect(result.triageFlags.capApplied).toBe(55);
    expect(result.triageFlags.reason).toMatch(/Negative Diff Detected/);

    const domainDim = result.dimensionScores.find((d: any) => d.dimension === "Domain-Specific Excellence");
    expect(domainDim?.score).toBe(10); // min(14, 10)
    expect(result.strengths).toContain("Domain-Specific Excellence: 10/20");
  });
});

describe("computeFinalEvaluation — sub-baseline zero-out branch", () => {
  it("scores 0 when the absolute score is both below baseline and below 25", () => {
    // dims sum to 20; baseline 60 -> rawDelta -40 (already forces headroomEff to 0 and the 0.4 term to 0
    // via Math.max(0, rawDelta), so this branch is currently vacuous — documented here as a golden fact)
    const lowPass = makePass({
      clarityScore: 4, depthScore: 4, structureScore: 4, actionabilityScore: 4, domainScore: 4
    });
    const scoreResult = aggregatePasses([lowPass, lowPass, lowPass])!;
    const session = baseSession({ baselineQualityScore: 60, headroom: 40 });

    const result = computeFinalEvaluation(session, scoreResult, "improved output", PLAIN_REVISION, 30, false);

    expect(result.score).toBe(0);
    expect(result.headroomEfficiencyScore).toBe(0);
    expect(result.rawDeltaScore).toBe(-40);
  });
});

describe("computeFinalEvaluation — comparable flag", () => {
  const passes = [makePass(), makePass(), makePass()];

  it("is true when every condition is favorable", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession();
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.comparable).toBe(true);
  });

  it("is false when the generation model was a static fallback", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ generationModelUsed: "static-fallback" });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.comparable).toBe(false);
  });

  it("is false when the baseline band was wide", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ baselineBandWide: true });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.comparable).toBe(false);
  });

  it("is false when the judge is unstable (baseline spread > 4)", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ baselineSpread: 5 });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.judgeUnstable).toBe(true);
    expect(result.comparable).toBe(false);
  });

  it("is false when the judge is unstable (final pass spread > 4)", () => {
    const unstablePasses = [
      makePass({ clarityScore: 4 }),
      makePass({ clarityScore: 18 }),
      makePass({ clarityScore: 10 })
    ];
    const scoreResult = aggregatePasses(unstablePasses)!;
    const session = baseSession();
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.judgeUnstable).toBe(true);
    expect(result.comparable).toBe(false);
  });

  it("is false when the regex injection scan is suspicious", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession();
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, true);
    expect(result.comparable).toBe(false);
  });

  it("is false when the model confirms an integrity violation", () => {
    const violationPasses = [
      makePass({ integrityViolation: true }),
      makePass({ integrityViolation: true }),
      makePass({ integrityViolation: true })
    ];
    const scoreResult = aggregatePasses(violationPasses)!;
    const session = baseSession();
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.comparable).toBe(false);
  });

  it("is false when the time budget was exceeded", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ timeLimit: 90 });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 200, false);
    expect(result.timeExceeded).toBe(true);
    expect(result.comparable).toBe(false);
  });

  it("is false for a historical static-fallback session (no fallback mode exists going forward)", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ generationModelUsed: "static-fallback" });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.comparable).toBe(false);
  });

  it("stays comparable regardless of which real model generated the task, since there is only one pinned model", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ generationModelUsed: "gemini-3.1-pro-preview" });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.comparable).toBe(true);
  });

  it("is false when the session's executor model does not match the currently pinned EXECUTOR_MODEL", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession({ executorModel: "some-other-model" });
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.executorModelMismatch).toBe(true);
    expect(result.comparable).toBe(false);
  });

  it("reports executorModelMismatch=false and stays comparable when the executor model matches", () => {
    const scoreResult = aggregatePasses(passes)!;
    const session = baseSession();
    const result = computeFinalEvaluation(session, scoreResult, "out", PLAIN_REVISION, 30, false);
    expect(result.executorModelMismatch).toBe(false);
    expect(result.comparable).toBe(true);
  });
});
