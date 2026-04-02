import { describe, expect, it } from "vitest";
import { isSelectionAtCardBoundary } from "../src/components/CardEditor";

describe("CardEditor boundary navigation helpers", () => {
  it("treats the start of the text as the upward navigation boundary", () => {
    expect(isSelectionAtCardBoundary(0, 0, 48, "up")).toBe(true);
    expect(isSelectionAtCardBoundary(4, 4, 48, "up")).toBe(false);
  });

  it("treats the end of the text as the downward navigation boundary", () => {
    expect(isSelectionAtCardBoundary(48, 48, 48, "down")).toBe(true);
    expect(isSelectionAtCardBoundary(47, 47, 48, "down")).toBe(false);
  });

  it("treats the end of the text as the rightward navigation boundary", () => {
    expect(isSelectionAtCardBoundary(48, 48, 48, "right")).toBe(true);
    expect(isSelectionAtCardBoundary(47, 47, 48, "right")).toBe(false);
  });
});
