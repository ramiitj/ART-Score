import { describe, it, expect } from "vitest";
import { buildSelfRevisePrompt } from "../prompts";

describe("buildSelfRevisePrompt", () => {
  it("embeds the task and prior output with no human-revision framing", () => {
    const prompt = buildSelfRevisePrompt("Write a memo about Q3 budget.", "Here is a draft memo.");

    expect(prompt).toContain("Write a memo about Q3 budget.");
    expect(prompt).toContain("Here is a draft memo.");
    expect(prompt).toMatch(/Critically revise your own answer/i);
    expect(prompt).not.toMatch(/user_revision_instructions/i);
  });

  it("is a pure function of its inputs", () => {
    const a = buildSelfRevisePrompt("Task A", "Output A");
    const b = buildSelfRevisePrompt("Task A", "Output A");
    expect(a).toBe(b);
  });
});
