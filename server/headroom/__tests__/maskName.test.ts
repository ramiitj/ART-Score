import { describe, it, expect } from "vitest";
import { maskName } from "../maskName";

describe("maskName", () => {
  it("returns Anonymous for empty input", () => {
    expect(maskName("")).toBe("Anonymous");
  });

  it("masks a single name to first-initial plus asterisks", () => {
    expect(maskName("John")).toBe("J***");
  });

  it("masks each part of a multi-word name independently", () => {
    expect(maskName("John Doe")).toBe("J*** D***");
  });

  it("masks single-character name parts the same way", () => {
    expect(maskName("A B")).toBe("A*** B***");
  });

  it("collapses extra whitespace between and around parts", () => {
    expect(maskName("  Jane   Q Public  ")).toBe("J*** Q*** P***");
  });
});
