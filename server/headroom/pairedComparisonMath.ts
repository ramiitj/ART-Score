import { Type } from "@google/genai";
import type { PairedComparisonResult, PairedPassOutcome, PairedPassRaw } from "./types";
import { VALIDITY_GATE_THRESHOLD } from "./constants";

// Blind: the judge sees only "A" and "B", never which one is the human's.
export const PAIRED_COMPARISON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    winner: { type: Type.STRING, description: "Exactly 'A' or 'B'." },
    margin: { type: Type.INTEGER, description: "1=slight, 2=clear, 3=decisive." },
    rationale: { type: Type.STRING }
  },
  required: ["winner", "margin", "rationale"]
};

export function buildPairedComparisonPrompt(task: string, optionA: string, optionB: string): string {
  return `You are comparing two candidate outputs for the same task. You do not know how
either was produced. Judge only which is higher quality for the task.

Task:
${task}

OUTPUT A:
"${optionA}"

OUTPUT B:
"${optionB}"

Decide which output is better overall and how decisively. Do not reward length
or formatting for their own sake — reward substantive quality for the task.`;
}

// Un-randomizes each pass back to {ceiling, steered} and aggregates into a
// Bradley-Terry win probability plus a validity gate. Position is randomized
// independently per pass upstream, so no consistent order signal survives.
export function aggregatePairedComparison(rawPasses: PairedPassRaw[]): PairedComparisonResult {
  const passes: PairedPassOutcome[] = rawPasses.map(p => ({
    steeredWon: (p.winner === "A") === p.steeredIsA,
    margin: p.margin,
    rationale: p.rationale
  }));

  const passCount = passes.length;
  const steeredWins = passes.filter(p => p.steeredWon).length;
  const pSteered = passCount === 0 ? 0 : steeredWins / passCount;

  // Regularized (Laplace-smoothed) log-odds avoids +/-Infinity on a unanimous 3-0 pass.
  const btLogOdds = Math.log((steeredWins + 0.5) / (passCount - steeredWins + 0.5));

  const disagreement = steeredWins > 0 && steeredWins < passCount;
  const validityGatePassed = passCount > 0 && pSteered >= VALIDITY_GATE_THRESHOLD;

  return { steeredWins, passCount, pSteered, btLogOdds, disagreement, validityGatePassed, passes };
}
