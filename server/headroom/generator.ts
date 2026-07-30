import type { GoogleGenAI } from "@google/genai";
import { GAP_MANIFEST_SCHEMA, buildGapManifestPrompt } from "./manifestMath";
import type { GapItem } from "./types";

// Generates the hidden gap manifest once, before the person acts. Never
// throws — returns null on any failure so this stays additive shadow
// instrumentation that cannot break task generation.
export async function generateGapManifest(
  ai: GoogleGenAI,
  model: string,
  systemPrompt: string,
  task: string,
  baseline: string,
  domain: string
): Promise<GapItem[] | null> {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: buildGapManifestPrompt(task, baseline, domain),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: GAP_MANIFEST_SCHEMA
      }
    });

    const parsed = JSON.parse(res.text || "{}");
    if (!Array.isArray(parsed.gapManifest)) return null;

    const items: GapItem[] = parsed.gapManifest
      .filter((g: any) => g && typeof g.id === "string" && typeof g.dimension === "string" && typeof g.description === "string")
      .slice(0, 5);

    return items.length > 0 ? items : null;
  } catch (err) {
    console.warn("[Generator — Gap Manifest] Failed to generate gap manifest.", err);
    return null;
  }
}
