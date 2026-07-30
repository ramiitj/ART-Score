import { describe, it, expect, vi } from "vitest";
import { generateGapManifest } from "../generator";
import type { GoogleGenAI } from "@google/genai";

function mockAi(text: string | (() => never)): GoogleGenAI {
  return {
    models: {
      generateContent: vi.fn(async () => {
        if (typeof text === "function") return text();
        return { text };
      })
    }
  } as unknown as GoogleGenAI;
}

describe("generateGapManifest", () => {
  it("parses a well-formed manifest", async () => {
    const ai = mockAi(JSON.stringify({
      gapManifest: [
        { id: "G1", dimension: "Depth", description: "Adds a mechanism." },
        { id: "G2", dimension: "Structure", description: "Reorganizes for clarity." }
      ]
    }));

    const result = await generateGapManifest(ai, "gemini-3.5-flash", "system prompt", "task", "baseline", "Software Engineering");

    expect(result).toEqual([
      { id: "G1", dimension: "Depth", description: "Adds a mechanism." },
      { id: "G2", dimension: "Structure", description: "Reorganizes for clarity." }
    ]);
  });

  it("caps the manifest at 5 items", async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      id: `G${i}`,
      dimension: "Depth",
      description: `gap ${i}`
    }));
    const ai = mockAi(JSON.stringify({ gapManifest: items }));

    const result = await generateGapManifest(ai, "gemini-3.5-flash", "system prompt", "task", "baseline", "Marketing");
    expect(result).toHaveLength(5);
  });

  it("drops malformed entries and returns null if nothing valid remains", async () => {
    const ai = mockAi(JSON.stringify({ gapManifest: [{ id: "G1" /* missing dimension/description */ }] }));
    const result = await generateGapManifest(ai, "gemini-3.5-flash", "system prompt", "task", "baseline", "Marketing");
    expect(result).toBeNull();
  });

  it("returns null (never throws) on malformed JSON", async () => {
    const ai = mockAi("not valid json");
    const result = await generateGapManifest(ai, "gemini-3.5-flash", "system prompt", "task", "baseline", "Marketing");
    expect(result).toBeNull();
  });

  it("returns null (never throws) when the model call rejects", async () => {
    const ai = mockAi(() => {
      throw new Error("network error");
    });
    const result = await generateGapManifest(ai, "gemini-3.5-flash", "system prompt", "task", "baseline", "Marketing");
    expect(result).toBeNull();
  });
});
