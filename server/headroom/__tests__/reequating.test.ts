import { describe, it, expect } from "vitest";
import { computeEquatingOffset, applyEquatingOffset, MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING } from "../reequating";
import type { AnchorItemPair } from "../reequating";

describe("computeEquatingOffset", () => {
  it("returns null when there are no anchor pairs", () => {
    expect(computeEquatingOffset([])).toBeNull();
  });

  it("computes the mean new-minus-old difference across pairs", () => {
    const pairs: AnchorItemPair[] = [
      { itemId: "a", oldModelScore: 50, newModelScore: 55 },
      { itemId: "b", oldModelScore: 60, newModelScore: 68 },
      { itemId: "c", oldModelScore: 40, newModelScore: 45 }
    ];
    const result = computeEquatingOffset(pairs)!;
    // diffs: 5, 8, 5 -> mean 6
    expect(result.offset).toBeCloseTo(6, 5);
    expect(result.n).toBe(3);
  });

  it("marks sufficientAnchors=false below MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING", () => {
    const pairs: AnchorItemPair[] = [{ itemId: "a", oldModelScore: 50, newModelScore: 55 }];
    const result = computeEquatingOffset(pairs)!;
    expect(result.n).toBe(1);
    expect(result.sufficientAnchors).toBe(false);
  });

  it("marks sufficientAnchors=true at or above the threshold", () => {
    const pairs: AnchorItemPair[] = Array.from({ length: MIN_ANCHOR_ITEMS_FOR_RELIABLE_EQUATING }, (_, i) => ({
      itemId: `item-${i}`,
      oldModelScore: 50,
      newModelScore: 50
    }));
    const result = computeEquatingOffset(pairs)!;
    expect(result.sufficientAnchors).toBe(true);
  });

  it("allows a negative offset when the new model scores lower", () => {
    const pairs: AnchorItemPair[] = [
      { itemId: "a", oldModelScore: 60, newModelScore: 50 },
      { itemId: "b", oldModelScore: 60, newModelScore: 50 }
    ];
    const result = computeEquatingOffset(pairs)!;
    expect(result.offset).toBeCloseTo(-10, 5);
  });
});

describe("applyEquatingOffset", () => {
  it("shifts an old-era score by the computed offset", () => {
    const equating = { offset: 6, n: 3, sufficientAnchors: false };
    expect(applyEquatingOffset(50, equating)).toBe(56);
  });

  it("shifts down for a negative offset", () => {
    const equating = { offset: -10, n: 2, sufficientAnchors: false };
    expect(applyEquatingOffset(60, equating)).toBe(50);
  });
});
