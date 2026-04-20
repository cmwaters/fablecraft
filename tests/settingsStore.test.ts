import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadStoredUiPreferences,
  useSettingsStore,
} from "../src/state/settingsStore";

const STORAGE_KEY = "fablecraft.ui-settings";

describe("settings persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSettingsStore.getState().resetPreferences();
  });

  afterEach(() => {
    useSettingsStore.getState().resetPreferences();
  });

  it("writes every preference change back to localStorage", () => {
    useSettingsStore.getState().setTheme("dark");
    useSettingsStore.getState().setFont("serif");
    useSettingsStore.getState().setScrollPan("disabled");

    const stored = window.localStorage.getItem(STORAGE_KEY);

    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as Record<string, string>;
    expect(parsed.theme).toBe("dark");
    expect(parsed.font).toBe("serif");
    expect(parsed.scrollPan).toBe("disabled");
  });

  it("restores stored preferences on a fresh load", () => {
    useSettingsStore.getState().setTheme("dark");
    useSettingsStore.getState().setCardWidth("wide");

    expect(loadStoredUiPreferences()).toMatchObject({
      cardWidth: "wide",
      theme: "dark",
    });
  });

  it("falls back to defaults when stored JSON is corrupted", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");

    const restored = loadStoredUiPreferences();

    expect(restored.theme).toBe("light");
    expect(restored.font).toBe("sans");
  });

  it("normalizes legacy theme names to a supported theme", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: "paper", font: "serif" }),
    );

    expect(loadStoredUiPreferences().theme).toBe("light");
    expect(loadStoredUiPreferences().font).toBe("serif");
  });

  it("ignores unknown preference values rather than adopting them", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: "hacked", cardWidth: "huge" }),
    );

    const restored = loadStoredUiPreferences();

    expect(restored.theme).toBe("light");
    expect(restored.cardWidth).toBe("standard");
  });
});
