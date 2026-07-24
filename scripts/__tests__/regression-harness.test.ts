import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { toRecords, loadAttempts } from "../regression-harness";

describe("toRecords", () => {
  it("excludes non-comparable attempts", () => {
    const attempts = [
      { comparable: false, score: 90, headroomShadow: { headroomScoreShadow: 0.9, validityGatePassed: true } },
      { comparable: true, score: 40, headroomShadow: { headroomScoreShadow: 0.4, validityGatePassed: true } }
    ];
    const records = toRecords(attempts);
    expect(records).toHaveLength(1);
    expect(records[0].oldScore).toBe(40);
  });

  it("excludes attempts with no headroomShadow computed", () => {
    const attempts = [
      { comparable: true, score: 50, headroomShadow: null },
      { comparable: true, score: 60, evaluation: { score: 60 } } // no headroomShadow field at all
    ];
    const records = toRecords(attempts);
    expect(records).toHaveLength(0);
  });

  it("reads oldScore from evaluation.score, falling back to top-level score", () => {
    const attempts = [
      { comparable: true, evaluation: { score: 33 }, headroomShadow: { headroomScoreShadow: 0.3, validityGatePassed: true } },
      { comparable: true, score: 77, headroomShadow: { headroomScoreShadow: 0.7, validityGatePassed: true } }
    ];
    const records = toRecords(attempts);
    expect(records[0].oldScore).toBe(33);
    expect(records[1].oldScore).toBe(77);
  });

  it("reads validityGatePassed from headroomShadow, defaulting to false when absent", () => {
    const attempts = [
      { comparable: true, score: 50, headroomShadow: { headroomScoreShadow: 0.5 } }
    ];
    const records = toRecords(attempts);
    expect(records[0].validityGatePassed).toBe(false);
  });
});

describe("loadAttempts", () => {
  const tmpFiles: string[] = [];

  afterEach(() => {
    while (tmpFiles.length) {
      const f = tmpFiles.pop()!;
      try { unlinkSync(f); } catch { /* already removed */ }
    }
  });

  function writeTempJson(content: unknown): string {
    const filePath = join(tmpdir(), `regression-harness-test-${Date.now()}-${Math.random()}.json`);
    writeFileSync(filePath, JSON.stringify(content));
    tmpFiles.push(filePath);
    return filePath;
  }

  it("loads a bare JSON array", () => {
    const filePath = writeTempJson([{ comparable: true, score: 1, headroomShadow: { headroomScoreShadow: 0.1 } }]);
    expect(loadAttempts(filePath)).toHaveLength(1);
  });

  it("loads an object with an attempts field", () => {
    const filePath = writeTempJson({ attempts: [{ comparable: true, score: 1 }] });
    expect(loadAttempts(filePath)).toHaveLength(1);
  });

  it("throws on an unrecognized shape", () => {
    const filePath = writeTempJson({ notAttempts: [] });
    expect(() => loadAttempts(filePath)).toThrow();
  });
});
