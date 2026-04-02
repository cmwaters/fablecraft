import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsDialog } from "../src/components/SettingsDialog";
import { useSettingsStore } from "../src/state/settingsStore";

describe("SettingsDialog", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    useSettingsStore.getState().resetPreferences();
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    document.body.innerHTML = "";
    useSettingsStore.getState().resetPreferences();
  });

  it("uses row-based inline controls instead of native selectors", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<SettingsDialog onClose={() => {}} />);
    });

    expect(container.querySelectorAll("select")).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid^="setting-row-"]')).toHaveLength(5);
    expect(container.textContent).toContain("Text Size");
    expect(container.textContent).toContain("Light");
    expect(container.textContent).toContain("Dark");
    expect(
      container.querySelector('[data-testid="setting-row-theme"]')?.textContent,
    ).toContain("Light");
    expect(container.querySelector('[data-testid="overlay-panel"]')?.className).toContain(
      "max-h-[calc(100vh-2rem)]",
    );
    expect(container.querySelector('[data-testid="overlay-content"]')?.className).toContain(
      "overflow-y-auto",
    );

    act(() => {
      root.unmount();
    });
  });

  it("focuses the first settings row when the dialog opens", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<SettingsDialog onClose={() => {}} />);
    });

    const themeRow = container.querySelector(
      '[data-testid="setting-row-theme"]',
    ) as HTMLDivElement | null;

    expect(document.activeElement).toBe(themeRow);

    act(() => {
      root.unmount();
    });
  });

  it("uses up/down to move rows and left/right to change the current row", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<SettingsDialog onClose={() => {}} />);
    });

    const themeRow = container.querySelector(
      '[data-testid="setting-row-theme"]',
    ) as HTMLDivElement | null;
    const fontRow = container.querySelector(
      '[data-testid="setting-row-font"]',
    ) as HTMLDivElement | null;

    expect(themeRow).toBeDefined();
    expect(fontRow).toBeDefined();
    expect(useSettingsStore.getState().preferences.theme).toBe("light");

    act(() => {
      themeRow?.focus();
      themeRow?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
        }),
      );
    });

    expect(useSettingsStore.getState().preferences.theme).toBe("dark");
    expect(themeRow?.textContent).toContain("Dark");

    act(() => {
      themeRow?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
        }),
      );
    });

    expect(document.activeElement).toBe(fontRow);

    act(() => {
      root.unmount();
    });
  });
});
