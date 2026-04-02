import { create } from "zustand";
import {
  applyUiTokens,
  defaultUiPreferences,
  normalizeUiPreferences,
  type UiCardWidth,
  type UiFont,
  type UiLineHeight,
  type UiPreferences,
  type UiTextSize,
  type UiTheme,
} from "../styles/tokens";

const SETTINGS_STORAGE_KEY = "fablecraft.ui-settings";

interface SettingsState {
  preferences: UiPreferences;
  resetPreferences: () => void;
  setCardWidth: (cardWidth: UiCardWidth) => void;
  setFont: (font: UiFont) => void;
  setLineHeight: (lineHeight: UiLineHeight) => void;
  setTextSize: (textSize: UiTextSize) => void;
  setTheme: (theme: UiTheme) => void;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoredUiPreferences() {
  if (!canUseStorage()) {
    return defaultUiPreferences;
  }

  try {
    const storedValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!storedValue) {
      return defaultUiPreferences;
    }

    return normalizeUiPreferences(JSON.parse(storedValue) as Partial<UiPreferences>);
  } catch {
    return defaultUiPreferences;
  }
}

function persistUiPreferences(preferences: UiPreferences) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
}

function commitPreferences(preferences: UiPreferences) {
  persistUiPreferences(preferences);
  applyUiTokens(preferences);
  return preferences;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  preferences: loadStoredUiPreferences(),
  resetPreferences: () =>
    set(() => ({
      preferences: commitPreferences(defaultUiPreferences),
    })),
  setCardWidth: (cardWidth) =>
    set((state) => ({
      preferences: commitPreferences({
        ...state.preferences,
        cardWidth,
      }),
    })),
  setFont: (font) =>
    set((state) => ({
      preferences: commitPreferences({
        ...state.preferences,
        font,
      }),
    })),
  setLineHeight: (lineHeight) =>
    set((state) => ({
      preferences: commitPreferences({
        ...state.preferences,
        lineHeight,
      }),
    })),
  setTextSize: (textSize) =>
    set((state) => ({
      preferences: commitPreferences({
        ...state.preferences,
        textSize,
      }),
    })),
  setTheme: (theme) =>
    set((state) => ({
      preferences: commitPreferences({
        ...state.preferences,
        theme,
      }),
    })),
}));
