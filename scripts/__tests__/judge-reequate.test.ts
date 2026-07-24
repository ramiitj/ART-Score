import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadAnchorPairs } from "../judge-reequate";

describe("loadAnchorPairs", () => {
  const tmpFiles: string[] = [];

  afterEach(() => {
    while (tmpFiles.length) {
      const f = tmpFiles.pop()!;
      try { unlinkSync(f); } catch { /* already removed */ }
    }
  });

  function writeTempJson(content: unknown): string {
    const filePath = join(tmpdir(), `judge-reequate-test-${Date.now()}-${Math.random()}.json`);
    writeFileSync(filePath, JSON.stringify(content));
    tmpFiles.push(filePath);
    return filePath;
  }

  it("loads a bare JSON array of pairs", () => {
    const filePath = writeTempJson([
      { itemId: "a", oldModelScore: 50, newModelScore: 55 }
    ]);
    const pairs = loadAnchorPairs(filePath);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].itemId).toBe("a");
  });

  it("loads an object with a pairs field", () => {
    const filePath = writeTempJson({
      pairs: [{ itemId: "b", oldModelScore: 40, newModelScore: 45 }]
    });
    const pairs = loadAnchorPairs(filePath);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].itemId).toBe("b");
  });

  it("throws on a shape that is neither an array nor { pairs: [...] }", () => {
    const filePath = writeTempJson({ notPairs: [] });
    expect(() => loadAnchorPairs(filePath)).toThrow();
  });
});
