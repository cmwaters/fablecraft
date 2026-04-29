import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.unstubAllEnvs();
    vi.resetModules();
    document.body.innerHTML = "";
  });

  it("builds the macOS download URL from the latest GitHub release config", async () => {
    const { buildGithubLatestReleaseAssetUrl } = await import("../src/site/siteContent");

    expect(
      buildGithubLatestReleaseAssetUrl({
        assetName: "Fablecraft-macos-arm64.dmg",
        owner: "fablecraft",
        repo: "desktop",
      }),
    ).toBe(
      "https://github.com/fablecraft/desktop/releases/latest/download/Fablecraft-macos-arm64.dmg",
    );
    expect(
      buildGithubLatestReleaseAssetUrl({
        assetName: null,
        owner: "fablecraft",
        repo: "desktop",
      }),
    ).toBeNull();
  });

  it("renders a live macOS download link when GitHub release config is present", async () => {
    vi.stubEnv("VITE_FABLECRAFT_GITHUB_OWNER", "fablecraft");
    vi.stubEnv("VITE_FABLECRAFT_GITHUB_REPO", "desktop");
    vi.stubEnv("VITE_FABLECRAFT_DOWNLOAD_MAC_ASSET_NAME", "Fablecraft-macos-arm64.dmg");

    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    });

    const { WebsiteHome } = await import("../src/components/WebsiteHome");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<WebsiteHome />);
    });

    expect(container.textContent).toContain("The Writers Tool for Structured Thought.");
    expect(container.textContent).toContain("Download for macOS");
    expect(container.textContent).toContain("Try it out!");

    const downloadLink = Array.from(container.querySelectorAll("a")).find(
      (element) => element.textContent?.trim() === "Download for macOS",
    );
    expect(downloadLink?.getAttribute("href")).toBe(
      "https://github.com/fablecraft/desktop/releases/latest/download/Fablecraft-macos-arm64.dmg",
    );

    expect(container.querySelector('[id="demo"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("renders a muted macOS download label when GitHub release config is missing", async () => {
    vi.stubEnv("VITE_FABLECRAFT_GITHUB_OWNER", "");
    vi.stubEnv("VITE_FABLECRAFT_GITHUB_REPO", "");
    vi.stubEnv("VITE_FABLECRAFT_DOWNLOAD_MAC_ASSET_NAME", "");

    const { WebsiteHome } = await import("../src/components/WebsiteHome");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<WebsiteHome />);
    });

    const mutedDownload = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === "macOS — coming soon",
    );
    expect(mutedDownload).not.toBeUndefined();
    expect(
      Array.from(container.querySelectorAll("a")).some(
        (element) => element.textContent === "Download for macOS",
      ),
    ).toBe(false);

    act(() => {
      root.unmount();
    });
  });
});
