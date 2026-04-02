import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebsiteHome } from "../src/components/WebsiteHome";

describe("WebsiteHome", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    document.body.innerHTML = "";
  });

  it("renders the public website hero, demo, and footer", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<WebsiteHome />);
    });

    expect(container.textContent).toContain("The Writers Tool for Structured Thought.");
    expect(container.textContent).toContain("Download preview");
    expect(container.textContent).toContain("Organize your ideas");
    expect(container.textContent).toContain("Back to top");

    const demoImg = container.querySelector(
      '[data-testid="site-product-screenshot"]',
    ) as HTMLImageElement | null;
    expect(demoImg).not.toBeNull();
    expect(demoImg?.getAttribute("src")).toBe("/screenshot.png");
    expect(demoImg?.getAttribute("loading")).toBe("lazy");

    act(() => {
      root.unmount();
    });
  });
});
