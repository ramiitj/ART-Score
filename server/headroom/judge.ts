import type { GoogleGenAI } from "@google/genai";
import { JUDGE_MODEL, JUDGE_TEMPERATURE, JUDGE_PASS_COUNT } from "./constants";
import { PAIRED_COMPARISON_SCHEMA, buildPairedComparisonPrompt, aggregatePairedComparison } from "./pairedComparisonMath";
import { MANIFEST_RESOLUTION_SCHEMA, buildManifestResolutionPrompt, aggregateManifestResolution } from "./manifestMath";
import type {
  GapItem,
  ManifestPassRaw,
  ManifestResolutionResult,
  PairedComparisonResult,
  PairedPassRaw
} from "./types";

// Blind on purpose: this instruction never mentions revision, human authorship,
// or which output is which — the judge sees only "A"/"B" or "X"/"Y".
const BLIND_JUDGE_INSTRUCTION =
  "You are a blind quality judge. You never see which output came from a human or a model, and your judgment must not be swayed by which position an output appears in.";

function validatePairedPass(text: string): { winner: "A" | "B"; margin: number; rationale: string } {
  const parsed = JSON.parse(text);
  if (parsed.winner !== "A" && parsed.winner !== "B") {
    throw new Error("winner must be exactly 'A' or 'B'.");
  }
  const margin = Number(parsed.margin);
  if (Number.isNaN(margin) || !Number.isInteger(margin)) {
    throw new Error("margin must be an integer.");
  }
  return { winner: parsed.winner, margin, rationale: String(parsed.rationale || "") };
}

// Runs JUDGE_PASS_COUNT blind passes comparing the self-revised ceiling
// against the steered output, randomizing which slot ("A" or "B") the
// steered output lands in on every pass, then un-randomizes and aggregates.
export async function judgePairedComparison(
  ai: GoogleGenAI,
  task: string,
  ceilingOutput: string,
  steeredOutput: string
): Promise<PairedComparisonResult | null> {
  const config = {
    systemInstruction: BLIND_JUDGE_INSTRUCTION,
    temperature: JUDGE_TEMPERATURE,
    responseMimeType: "application/json",
    responseSchema: PAIRED_COMPARISON_SCHEMA
  };

  const runPass = async (): Promise<PairedPassRaw> => {
    const steeredIsA = Math.random() < 0.5;
    const optionA = steeredIsA ? steeredOutput : ceilingOutput;
    const optionB = steeredIsA ? ceilingOutput : steeredOutput;

    const res = await ai.models.generateContent({
      model: JUDGE_MODEL,
      contents: buildPairedComparisonPrompt(task, optionA, optionB),
      config
    });
    const parsed = validatePairedPass(res.text || "{}");
    return { steeredIsA, ...parsed };
  };

  const settled = await Promise.allSettled(Array.from({ length: JUDGE_PASS_COUNT }, () => runPass()));
  const validPasses = settled
    .filter((s): s is PromiseFulfilledResult<PairedPassRaw> => s.status === "fulfilled")
    .map(s => s.value);

  if (validPasses.length < JUDGE_PASS_COUNT) {
    console.warn(`[Judge v2 — Paired Comparison] Only ${validPasses.length}/${JUDGE_PASS_COUNT} valid passes; skipping.`);
    return null;
  }

  return aggregatePairedComparison(validPasses);
}

function validateManifestPass(
  text: string,
  gapManifest: GapItem[]
): { id: string; resolvedInX: boolean; resolvedInY: boolean; rationale: string }[] {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.items)) {
    throw new Error("items must be an array.");
  }
  const knownIds = new Set(gapManifest.map(g => g.id));
  return parsed.items
    .filter((it: any) => it && knownIds.has(it.id))
    .map((it: any) => ({
      id: it.id,
      resolvedInX: Boolean(it.resolvedInX),
      resolvedInY: Boolean(it.resolvedInY),
      rationale: String(it.rationale || "")
    }));
}

// Runs JUDGE_PASS_COUNT blind passes checking, for each manifest gap,
// whether the ceiling and the steered output resolve it, randomizing which
// slot ("X" or "Y") the steered output lands in on every pass.
export async function judgeManifestResolution(
  ai: GoogleGenAI,
  task: string,
  gapManifest: GapItem[],
  ceilingOutput: string,
  steeredOutput: string
): Promise<ManifestResolutionResult | null> {
  if (gapManifest.length === 0) return null;

  const config = {
    systemInstruction: BLIND_JUDGE_INSTRUCTION,
    temperature: JUDGE_TEMPERATURE,
    responseMimeType: "application/json",
    responseSchema: MANIFEST_RESOLUTION_SCHEMA
  };

  const runPass = async (): Promise<ManifestPassRaw> => {
    const steeredIsX = Math.random() < 0.5;
    const optionX = steeredIsX ? steeredOutput : ceilingOutput;
    const optionY = steeredIsX ? ceilingOutput : steeredOutput;

    const res = await ai.models.generateContent({
      model: JUDGE_MODEL,
      contents: buildManifestResolutionPrompt(task, gapManifest, optionX, optionY),
      config
    });
    const items = validateManifestPass(res.text || "{}", gapManifest);
    return { steeredIsX, items };
  };

  const settled = await Promise.allSettled(Array.from({ length: JUDGE_PASS_COUNT }, () => runPass()));
  const validPasses = settled
    .filter((s): s is PromiseFulfilledResult<ManifestPassRaw> => s.status === "fulfilled")
    .map(s => s.value);

  if (validPasses.length < JUDGE_PASS_COUNT) {
    console.warn(`[Judge v2 — Manifest Resolution] Only ${validPasses.length}/${JUDGE_PASS_COUNT} valid passes; skipping.`);
    return null;
  }

  return aggregateManifestResolution(gapManifest, validPasses);
}
