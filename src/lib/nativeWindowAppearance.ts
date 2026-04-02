import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow, type Color, type TitleBarStyle } from "@tauri-apps/api/window";
import { themeSurfaceColor, type UiTheme } from "../styles/tokens";

interface NativeWindowAppearance {
  backgroundColor: Color;
  theme: UiTheme;
  titleBarStyle: TitleBarStyle;
}

const MAC_TITLE_BAR_STYLE: TitleBarStyle = "transparent";

export function resolveNativeWindowAppearance(theme: UiTheme): NativeWindowAppearance {
  return {
    backgroundColor: hexColorToRgb(themeSurfaceColor(theme)),
    theme,
    titleBarStyle: MAC_TITLE_BAR_STYLE,
  };
}

export async function syncNativeWindowAppearance(theme: UiTheme) {
  if (!isTauri()) {
    return;
  }

  const appearance = resolveNativeWindowAppearance(theme);
  const currentWindow = getCurrentWindow();
  const operations: Array<Promise<void>> = [
    currentWindow.setBackgroundColor(appearance.backgroundColor),
    currentWindow.setTheme(appearance.theme),
  ];

  if (isMacOs()) {
    operations.push(currentWindow.setTitleBarStyle(appearance.titleBarStyle));
  }

  const results = await Promise.allSettled(operations);

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Fablecraft could not sync the native window appearance.", result.reason);
    }
  });
}

function hexColorToRgb(hexColor: string): [number, number, number] {
  const normalizedValue = hexColor.trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalizedValue)) {
    throw new Error(`Unsupported theme color: ${hexColor}`);
  }

  return [
    Number.parseInt(normalizedValue.slice(0, 2), 16),
    Number.parseInt(normalizedValue.slice(2, 4), 16),
    Number.parseInt(normalizedValue.slice(4, 6), 16),
  ];
}

function isMacOs() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Mac/i.test(navigator.userAgent) || /Mac/i.test(navigator.platform);
}
