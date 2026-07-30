import { Type } from "@google/genai";
import type { GapItem, ManifestPassRaw, ManifestResolutionResult, ManifestItemResult } from "./types";

// --- Generator: hidden gap manifest -------------------------------------

export const GAP_MANIFEST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    gapManifest: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          dimension: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["id", "dimension", "description"]
      }
    }
  },
  required: ["gapManifest"]
};

// Generated once, before the person acts, and never sent to the client — it
// is the a-priori criterion that fixes what counts as improvement
// independently of the judge's momentary impression.
export function buildGapManifestPrompt(task: string, baseline: string, domain: string): string {
  return `Task:
${task}

Baseline output (the starting point a person will improve):
"${baseline}"

Before anyone revises this baseline, identify 3 to 5 concrete gaps between it
and an excellent response for this ${domain} task — dimensions on which a
better response would improve it (for example: depth, specificity, structure,
actionability, domain rigor, audience fit). Each gap must be independently
checkable: someone reading a candidate revision should be able to tell
whether that specific gap was resolved. Describe room for improvement, not
errors to fix — the baseline may or may not already fall short on each one.`;
}

// --- Judge: blind manifest resolution -----------------------------------

export const MANIFEST_RESOLUTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          resolvedInX: { type: Type.BOOLEAN },
          resolvedInY: { type: Type.BOOLEAN },
          rationale: { type: Type.STRING }
        },
        required: ["id", "resolvedInX", "resolvedInY", "rationale"]
      }
    }
  },
  required: ["items"]
};

export function buildManifestResolutionPrompt(task: string, gapManifest: GapItem[], optionX: string, optionY: string): string {
  const manifestText = gapManifest.map(g => `- ${g.id} (${g.dimension}): ${g.description}`).join("\n");
  return `You are checking whether two candidate outputs resolve a fixed list of
quality gaps identified in advance for the same task. You do not know how
either output was produced.

Task:
${task}

Gaps to check (identified before either output was seen):
${manifestText}

OUTPUT X:
"${optionX}"

OUTPUT Y:
"${optionY}"

For each gap, decide independently whether OUTPUT X resolves it and whether
OUTPUT Y resolves it. A gap is resolved only if the output substantively
addresses it, not merely gestures at it.`;
}

// Un-randomizes each pass back to {ceiling, steered} and takes a majority
// vote per gap per output. A gap counts as "closable" only if the
// self-revised ceiling does not already resolve it — the human is credited
// only for closing gaps the model would not have closed on its own.
export function aggregateManifestResolution(gapManifest: GapItem[], rawPasses: ManifestPassRaw[]): ManifestResolutionResult {
  const passCount = rawPasses.length;

  const items: ManifestItemResult[] = gapManifest.map(gap => {
    let ceilingVotes = 0;
    let steeredVotes = 0;

    for (const pass of rawPasses) {
      const found = pass.items.find(it => it.id === gap.id);
      if (!found) continue;

      const resolvedInCeilingThisPass = pass.steeredIsX ? found.resolvedInY : found.resolvedInX;
      const resolvedInSteeredThisPass = pass.steeredIsX ? found.resolvedInX : found.resolvedInY;

      if (resolvedInCeilingThisPass) ceilingVotes++;
      if (resolvedInSteeredThisPass) steeredVotes++;
    }

    return {
      id: gap.id,
      dimension: gap.dimension,
      resolvedInCeiling: ceilingVotes > passCount / 2,
      resolvedInSteered: steeredVotes > passCount / 2
    };
  });

  const closable = items.filter(it => !it.resolvedInCeiling);
  const resolved = closable.filter(it => it.resolvedInSteered);
  const closableCount = closable.length;
  const resolvedCount = resolved.length;
  const resolution = closableCount === 0 ? 0 : resolvedCount / closableCount;

  return { items, closableCount, resolvedCount, resolution };
}
