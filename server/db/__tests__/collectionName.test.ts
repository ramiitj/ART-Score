import { describe, it, expect } from "vitest";
import { validateCollectionPrefix, buildCollectionName, COLLECTIONS } from "../collectionName";

describe("validateCollectionPrefix", () => {
  it("accepts an empty prefix (unprefixed, original deployment)", () => {
    expect(() => validateCollectionPrefix("")).not.toThrow();
  });

  it("accepts a normal prefix", () => {
    expect(() => validateCollectionPrefix("v2_")).not.toThrow();
    expect(() => validateCollectionPrefix("artscore1_")).not.toThrow();
  });

  it("rejects a prefix containing a slash", () => {
    expect(() => validateCollectionPrefix("a/b")).toThrow(/must not contain/i);
  });

  it("rejects a prefix that is exactly . or ..", () => {
    expect(() => validateCollectionPrefix(".")).toThrow(/must not be/i);
    expect(() => validateCollectionPrefix("..")).toThrow(/must not be/i);
  });

  it("rejects a prefix matching Firestore's reserved __*__ pattern", () => {
    expect(() => validateCollectionPrefix("__reserved__")).toThrow(/reserves/i);
  });

  it("allows a prefix that merely contains underscores without matching __*__", () => {
    expect(() => validateCollectionPrefix("_v2_")).not.toThrow();
  });

  it("rejects a prefix that would push a collection name over the 1500-byte limit", () => {
    expect(() => validateCollectionPrefix("x".repeat(1500))).toThrow(/too long/i);
  });
});

describe("buildCollectionName", () => {
  it("returns the base name unchanged when the prefix is empty, undefined, or null", () => {
    expect(buildCollectionName("attempts", "")).toBe("attempts");
    expect(buildCollectionName("attempts", undefined)).toBe("attempts");
    expect(buildCollectionName("attempts", null)).toBe("attempts");
  });

  it("prepends a real prefix to the base name", () => {
    expect(buildCollectionName("attempts", "artscore1_")).toBe("artscore1_attempts");
  });

  it("produces a distinct name for every declared collection under the same prefix", () => {
    const names = COLLECTIONS.map(c => buildCollectionName(c, "v2_"));
    expect(new Set(names).size).toBe(COLLECTIONS.length);
  });
});
