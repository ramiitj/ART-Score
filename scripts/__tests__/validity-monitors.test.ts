import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadAttempts, toPSteeredValues, toModelEraRecords, toLeakageRecords } from "../validity-monitors";

describe("toPSteeredValues", () => {
  it("excludes non-comparable attempts", () => {
    const attempts = [
      { comparable: false, researchConsent: true, headroomShadow: { pSteered: 0.9 } },
      { comparable: true, researchConsent: true, headroomShadow: { pSteered: 0.6 } }
    ];
    expect(toPSteeredValues(attempts)).toEqual([0.6]);
  });

  it("excludes attempts with no headroomShadow or non-numeric pSteered", () => {
    const attempts = [
      { comparable: true, researchConsent: true, headroomShadow: null },
      { comparable: true, researchConsent: true },
      { comparable: true, researchConsent: true, headroomShadow: { pSteered: "not-a-number" } }
    ];
    expect(toPSteeredValues(attempts)).toEqual([]);
  });

  it("excludes attempts whose person did not consent to research use, even if comparable", () => {
    const attempts = [
      { comparable: true, researchConsent: false, headroomShadow: { pSteered: 0.9 } },
      { comparable: true, headroomShadow: { pSteered: 0.8 } }, // researchConsent absent
      { comparable: true, researchConsent: true, headroomShadow: { pSteered: 0.6 } }
    ];
    expect(toPSteeredValues(attempts)).toEqual([0.6]);
  });
});

describe("toModelEraRecords", () => {
  it("extracts model/headroomScoreShadow/timestamp from comparable attempts", () => {
    const attempts = [
      { comparable: true, researchConsent: true, executorModel: "model-a", headroomShadow: { headroomScoreShadow: 0.4 }, timestamp: "2026-01-01T00:00:00Z" }
    ];
    const records = toModelEraRecords(attempts);
    expect(records).toEqual([{ model: "model-a", headroomScoreShadow: 0.4, timestamp: "2026-01-01T00:00:00Z" }]);
  });

  it("excludes non-comparable attempts and attempts missing required fields", () => {
    const attempts = [
      { comparable: false, researchConsent: true, executorModel: "model-a", headroomShadow: { headroomScoreShadow: 0.4 }, timestamp: "2026-01-01T00:00:00Z" },
      { comparable: true, researchConsent: true, headroomShadow: { headroomScoreShadow: 0.4 }, timestamp: "2026-01-01T00:00:00Z" }, // no executorModel
      { comparable: true, researchConsent: true, executorModel: "model-a", timestamp: "2026-01-01T00:00:00Z" } // no headroomShadow
    ];
    expect(toModelEraRecords(attempts)).toEqual([]);
  });

  it("excludes attempts whose person did not consent to research use, even if comparable", () => {
    const attempts = [
      { comparable: true, researchConsent: false, executorModel: "model-a", headroomShadow: { headroomScoreShadow: 0.4 }, timestamp: "2026-01-01T00:00:00Z" }
    ];
    expect(toModelEraRecords(attempts)).toEqual([]);
  });
});

describe("toLeakageRecords", () => {
  it("extracts resolution/editDistanceNorm from comparable, consenting attempts", () => {
    const attempts = [
      { comparable: true, researchConsent: true, headroomShadow: { resolution: 0.5 }, editDistanceNorm: 0.2 }
    ];
    expect(toLeakageRecords(attempts)).toEqual([{ resolution: 0.5, editDistanceNorm: 0.2 }]);
  });

  it("excludes non-comparable, non-consenting, or incomplete attempts", () => {
    const attempts = [
      { comparable: false, researchConsent: true, headroomShadow: { resolution: 0.5 }, editDistanceNorm: 0.2 },
      { comparable: true, researchConsent: false, headroomShadow: { resolution: 0.5 }, editDistanceNorm: 0.2 },
      { comparable: true, researchConsent: true, headroomShadow: { resolution: 0.5 } } // no editDistanceNorm
    ];
    expect(toLeakageRecords(attempts)).toEqual([]);
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
    const filePath = join(tmpdir(), `validity-monitors-test-${Date.now()}-${Math.random()}.json`);
    writeFileSync(filePath, JSON.stringify(content));
    tmpFiles.push(filePath);
    return filePath;
  }

  it("loads a bare JSON array", () => {
    const filePath = writeTempJson([{ comparable: true }]);
    expect(loadAttempts(filePath)).toHaveLength(1);
  });

  it("loads an object with an attempts field", () => {
    const filePath = writeTempJson({ attempts: [{ comparable: true }] });
    expect(loadAttempts(filePath)).toHaveLength(1);
  });

  it("throws on an unrecognized shape", () => {
    const filePath = writeTempJson({ notAttempts: [] });
    expect(() => loadAttempts(filePath)).toThrow();
  });
});
