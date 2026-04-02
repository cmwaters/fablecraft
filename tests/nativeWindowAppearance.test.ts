import { describe, expect, it } from "vitest";
import { resolveNativeWindowAppearance } from "../src/lib/nativeWindowAppearance";

describe("resolveNativeWindowAppearance", () => {
  it("matches the light theme exactly to the card background", () => {
    expect(resolveNativeWindowAppearance("light")).toEqual({
      backgroundColor: [253, 246, 239],
      theme: "light",
      titleBarStyle: "transparent",
    });
  });

  it("matches the dark theme exactly to the card background", () => {
    expect(resolveNativeWindowAppearance("dark")).toEqual({
      backgroundColor: [33, 29, 26],
      theme: "dark",
      titleBarStyle: "transparent",
    });
  });
});
