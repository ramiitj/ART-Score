import { describe, it, expect } from "vitest";
import { toRecords } from "../variance-decomposition";

describe("toRecords", () => {
  it("keys items by sessionId, not domain::difficulty", () => {
    // Two different generated sessions sharing the same domain and
    // difficulty must be treated as two different items, not one.
    const attempts = [
      { sessionId: "session-a", userEmail: "alice@example.com", domain: "Software Engineering", difficulty: "Beginner", comparable: true, score: 40 },
      { sessionId: "session-b", userEmail: "alice@example.com", domain: "Software Engineering", difficulty: "Beginner", comparable: true, score: 70 }
    ];

    const records = toRecords(attempts);

    expect(records).toHaveLength(2);
    expect(records[0].itemKey).toBe("session-a");
    expect(records[1].itemKey).toBe("session-b");
    expect(records[0].itemKey).not.toBe(records[1].itemKey);
  });

  it("falls back to the export's id field when sessionId is absent", () => {
    const attempts = [{ id: "doc-id-1", userEmail: "a@example.com", comparable: true, score: 50 }];
    const records = toRecords(attempts);
    expect(records[0].itemKey).toBe("doc-id-1");
  });

  it("excludes non-comparable attempts", () => {
    const attempts = [
      { sessionId: "s1", userEmail: "a@example.com", comparable: false, score: 90 },
      { sessionId: "s2", userEmail: "a@example.com", comparable: true, score: 40 }
    ];
    const records = toRecords(attempts);
    expect(records).toHaveLength(1);
    expect(records[0].itemKey).toBe("s2");
  });

  it("reads the score from evaluation.score, falling back to the top-level score field", () => {
    const attempts = [
      { sessionId: "s1", userEmail: "a@example.com", comparable: true, evaluation: { score: 33 } },
      { sessionId: "s2", userEmail: "a@example.com", comparable: true, score: 77 }
    ];
    const records = toRecords(attempts);
    expect(records[0].value).toBe(33);
    expect(records[1].value).toBe(77);
  });

  it("skips records missing a person key or a usable score", () => {
    const attempts = [
      { sessionId: "s1", comparable: true, score: 50 }, // no userEmail/anonymizedUserId
      { sessionId: "s2", userEmail: "a@example.com", comparable: true, score: "not-a-number" }
    ];
    const records = toRecords(attempts);
    expect(records).toHaveLength(0);
  });
});
