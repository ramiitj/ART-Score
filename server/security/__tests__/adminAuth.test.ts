import { describe, it, expect } from "vitest";
import { parseAdminKeys, isValidAdminKey, fingerprintAdminKey } from "../adminAuth";

describe("parseAdminKeys", () => {
  it("splits comma-separated keys and trims whitespace", () => {
    expect(parseAdminKeys("key1, key2 ,key3")).toEqual(["key1", "key2", "key3"]);
  });

  it("drops empty entries", () => {
    expect(parseAdminKeys("key1,,key2,")).toEqual(["key1", "key2"]);
  });

  it("returns an empty array for undefined or empty input", () => {
    expect(parseAdminKeys(undefined)).toEqual([]);
    expect(parseAdminKeys("")).toEqual([]);
  });

  it("supports a single key with no commas", () => {
    expect(parseAdminKeys("only-key")).toEqual(["only-key"]);
  });
});

describe("isValidAdminKey", () => {
  const validKeys = ["key-one", "key-two"];

  it("accepts a key that matches any entry in the valid list", () => {
    expect(isValidAdminKey("key-one", validKeys)).toBe(true);
    expect(isValidAdminKey("key-two", validKeys)).toBe(true);
  });

  it("rejects a key that matches nothing", () => {
    expect(isValidAdminKey("wrong-key", validKeys)).toBe(false);
  });

  it("rejects an undefined or empty provided key", () => {
    expect(isValidAdminKey(undefined, validKeys)).toBe(false);
    expect(isValidAdminKey("", validKeys)).toBe(false);
  });

  it("rejects any key when the valid list is empty (admin access not configured)", () => {
    expect(isValidAdminKey("anything", [])).toBe(false);
  });

  it("handles keys of different lengths without throwing", () => {
    expect(isValidAdminKey("short", ["a-much-longer-valid-key"])).toBe(false);
    expect(isValidAdminKey("a-much-longer-valid-key", ["short"])).toBe(false);
  });
});

describe("fingerprintAdminKey", () => {
  it("is deterministic for the same key", () => {
    expect(fingerprintAdminKey("my-secret")).toBe(fingerprintAdminKey("my-secret"));
  });

  it("differs across different keys", () => {
    expect(fingerprintAdminKey("key-a")).not.toBe(fingerprintAdminKey("key-b"));
  });

  it("never contains the raw key", () => {
    const fp = fingerprintAdminKey("super-secret-value");
    expect(fp).not.toContain("super-secret-value");
    expect(fp.length).toBe(8);
  });
});
