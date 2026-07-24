import crypto from "crypto";
import { MASTER_SYSTEM_PROMPT } from "./constants";
import type { AggregatedScore } from "./types";

// Unify evaluation post-processing math, guardrails, caps, and comparable flag (FIX 6, 11)
export function computeFinalEvaluation(
  sessionData: any,
  scoreResult: AggregatedScore,
  improvedOutput: string,
  revision: string,
  timeTakenServerSeconds: number,
  injectionDetected: boolean
) {
  const p1 = scoreResult.passes[0];
  const p2 = scoreResult.passes[1];
  const p3 = scoreResult.passes[2];
  const finalAbsoluteScore = scoreResult.total;

  const sums = [
    p1.clarityScore + p1.depthScore + p1.structureScore + p1.actionabilityScore + p1.domainScore,
    p2.clarityScore + p2.depthScore + p2.structureScore + p2.actionabilityScore + p2.domainScore,
    p3.clarityScore + p3.depthScore + p3.structureScore + p3.actionabilityScore + p3.domainScore
  ];
  const diffs = sums.map(s => Math.abs(s - finalAbsoluteScore));
  const minIdx = diffs.indexOf(Math.min(...diffs));
  const rulingPass = scoreResult.passes[minIdx];

  const diffInventory = rulingPass.diffInventory || [];
  const substantiveCount = diffInventory.filter((d: any) => d.classification === "SUBSTANTIVE").length;
  const cosmeticCount = diffInventory.filter((d: any) => d.classification === "COSMETIC").length;
  const negativeCount = diffInventory.filter((d: any) => d.classification === "NEGATIVE").length;

  // v2 Scientific Normalization: Headroom Efficiency & Raw Delta Composite
  const rawDelta = finalAbsoluteScore - sessionData.baselineQualityScore;
  const clampedHeadroom = Math.max(sessionData.headroom, 5);
  let headroomEfficiencyScore = (rawDelta / clampedHeadroom) * 100;

  if (rawDelta < 0) headroomEfficiencyScore = 0;
  if (headroomEfficiencyScore > 100) headroomEfficiencyScore = 100;

  let finalScore = Math.round((headroomEfficiencyScore * 0.6) + (Math.max(0, rawDelta) * (100 / clampedHeadroom) * 0.4));

  if (finalScore > 100) finalScore = 100;
  if (finalScore < 0) finalScore = 0;

  if (finalAbsoluteScore < sessionData.baselineQualityScore && finalAbsoluteScore < 25) {
    finalScore = 0;
  }

  // Post-Processing Guards / Caps (C2-C5)
  let guardrailFired = false;
  let capApplied = 0;
  let guardrailReason = "";

  const countMarkdown = (str: string) => (str.match(/#|\*|- |\d+\. /g) || []).length;
  const countWords = (str: string) => str.trim().split(/\s+/).length;

  const baseMD = countMarkdown(sessionData.baseline);
  const revMD = countMarkdown(revision);
  const baseWords = countWords(sessionData.baseline);
  const revWords = countWords(revision);

  // C2: Formatting Fallacy Guardrail
  if (revMD > baseMD + 2 && revWords < baseWords + 10 && finalScore > 25) {
    finalScore = 25;
    guardrailFired = true;
    capApplied = 25;
    guardrailReason = "Formatting Fallacy: Added markdown structure without sufficient cognitive density addition.";
  }

  // C3: Cosmetic Changes Only Guardrail
  if (cosmeticCount > 0 && substantiveCount === 0 && finalScore > 20) {
    finalScore = 20;
    guardrailFired = true;
    capApplied = 20;
    guardrailReason = "Cosmetic Changes Only: Diff inventory detected no substantive additions.";
  }

  // C4: Premium Threshold Guardrail
  if (finalScore >= 75 && substantiveCount < 2) {
    finalScore = 74;
    guardrailFired = true;
    capApplied = 74;
    guardrailReason = "Premium Threshold Missed: Score >= 75 requires at least 2 substantive diffs.";
  }

  // C5: Negative Diff Detected Guardrail
  let resolvedDomainScore = scoreResult.medians.domain;
  if (negativeCount > 0) {
    if (finalScore > 55) {
      finalScore = 55;
      guardrailFired = true;
      capApplied = 55;
      guardrailReason = "Negative Diff Detected: Output introduced errors or unverified statements.";
    }
    resolvedDomainScore = Math.min(scoreResult.medians.domain, 10);
  }

  const dimensionScores = [
    { dimension: "Clarity & Precision", score: scoreResult.medians.clarity, rationale: rulingPass.clarityRationale },
    { dimension: "Depth of Analysis & Insight", score: scoreResult.medians.depth, rationale: rulingPass.depthRationale },
    { dimension: "Structure & Logical Flow", score: scoreResult.medians.structure, rationale: rulingPass.structureRationale },
    { dimension: "Actionability & Practical Value", score: scoreResult.medians.actionability, rationale: rulingPass.actionabilityRationale },
    { dimension: "Domain-Specific Excellence", score: resolvedDomainScore, rationale: rulingPass.domainRationale }
  ];

  const strengths = dimensionScores.map(d => `${d.dimension}: ${d.score}/20`);
  const promptHash = crypto.createHash("sha256").update(sessionData.systemPrompt || MASTER_SYSTEM_PROMPT).digest("hex");

  const timeExceeded = timeTakenServerSeconds > (sessionData.timeLimit + 20);
  const judgeUnstable = (sessionData.baselineSpread > 4) || (scoreResult.spread > 4);

  const comparable = !(
    sessionData.generationModelUsed === "static-fallback" ||
    sessionData.baselineBandWide === true ||
    judgeUnstable === true ||
    injectionDetected === true ||
    timeExceeded === true ||
    sessionData.generationModelUsed !== "gemini-3.1-flash-lite"
  );

  return {
    score: finalScore,
    headroomEfficiencyScore,
    rawDeltaScore: rawDelta,
    baselineQualityScore: sessionData.baselineQualityScore,
    strengths,
    insight: rulingPass.insight,
    clarity: improvedOutput,
    diffInventory: diffInventory.map((d: any) => `${d.classification}: ${d.changeDescription}`).join("\n"),
    selfChecks: rulingPass.selfChecks,
    confidence: rulingPass.confidence,
    dimensionScores,
    judgeMetadata: {
      modelVersion: "gemini-3.1-pro-preview",
      promptHash,
      temperature: 0,
      rubricVersionId: sessionData.rubricVersionId
    },
    triageFlags: { guardrailFired, reason: guardrailReason, capApplied },
    textTelemetry: {
      baselineLength: sessionData.baseline.length,
      revisionLength: revision.length,
      revisionWordCount: revWords
    },
    comparable,
    timeTakenServerSeconds,
    judgeUnstable,
    timeExceeded,
    finalSpread: scoreResult.spread,
    baselineSpread: sessionData.baselineSpread || 0
  };
}
