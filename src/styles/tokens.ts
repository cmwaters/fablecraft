export type UiTheme = "light" | "dark";
export type UiFont = "serif" | "sans";
export type UiTextSize = "comfortable" | "large";
export type UiLineHeight = "compact" | "relaxed";
export type UiCardWidth = "standard" | "wide";
export type UiScrollPan = "enabled" | "disabled";

export interface UiPreferences {
  cardWidth: UiCardWidth;
  font: UiFont;
  lineHeight: UiLineHeight;
  scrollPan: UiScrollPan;
  textSize: UiTextSize;
  theme: UiTheme;
}

const themeTokens = {
  light: {
    app: "#fdf6ef",
    border: "#a2978b",
    borderStrong: "#171412",
    focus: "#2a2521",
    muted: "#756c64",
    onDark: "#fff7f1",
    overlayBackdrop: "rgba(245, 236, 230, 0.82)",
    surface: "#fdf6ef",
    surfaceStrong: "#fffaf6",
    text: "#171412",
  },
  dark: {
    app: "#211d1a",
    border: "#756b61",
    borderStrong: "#f5eee5",
    focus: "#f5eee5",
    muted: "#bdb2a6",
    onDark: "#171412",
    overlayBackdrop: "rgba(16, 13, 11, 0.72)",
    surface: "#211d1a",
    surfaceStrong: "#2a2521",
    text: "#f5eee5",
  },
} satisfies Record<UiTheme, {
  app: string;
  border: string;
  borderStrong: string;
  focus: string;
  muted: string;
  onDark: string;
  overlayBackdrop: string;
  surface: string;
  surfaceStrong: string;
  text: string;
}>;

export function themeSurfaceColor(theme: UiTheme) {
  return themeTokens[theme].surface;
}

const fontTokens = {
  sans: {
    content: "\"Avenir Next\", \"Segoe UI\", sans-serif",
    ui: "\"Avenir Next\", \"Segoe UI\", sans-serif",
  },
  serif: {
    content: "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
    ui: "\"Avenir Next\", \"Segoe UI\", sans-serif",
  },
} satisfies Record<UiFont, { content: string; ui: string }>;

const textSizeTokens = {
  comfortable: "0.95rem",
  large: "1.05rem",
} satisfies Record<UiTextSize, string>;

const lineHeightTokens = {
  compact: "1.75rem",
  relaxed: "2rem",
} satisfies Record<UiLineHeight, string>;

const cardWidthTokens = {
  standard: 468,
  wide: 500,
} satisfies Record<UiCardWidth, number>;

const defaultUiPreferences: UiPreferences = {
  cardWidth: "standard",
  font: "sans",
  lineHeight: "compact",
  scrollPan: "enabled",
  textSize: "comfortable",
  theme: "light",
};

const uiTokens = {
  animationEasing: "cubic-bezier(0.2, 0.85, 0.3, 1)",
  animationMs: 140,
  cardHeight: 84,
  radius: {
    card: 6,
    pill: 999,
  },
  shadows: {
    card: "0 12px 28px rgba(23, 20, 18, 0.08)",
    elevated: "0 18px 40px rgba(23, 20, 18, 0.14)",
    soft: "0 8px 18px rgba(23, 20, 18, 0.08)",
  },
  spacing: 24,
};

type CssVariableMap = Record<string, string>;

function normalizeEnumValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowedValues.includes(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeUiPreferences(
  value: Partial<UiPreferences> | null | undefined,
): UiPreferences {
  const rawThemeValue =
    value &&
    typeof (value as Record<string, unknown>).theme === "string"
      ? ((value as Record<string, unknown>).theme as string)
      : undefined;
  const normalizedThemeValue =
    rawThemeValue === "paper" || rawThemeValue === "studio" ? "light" : rawThemeValue;

  return {
    cardWidth: normalizeEnumValue(
      value?.cardWidth,
      ["standard", "wide"],
      defaultUiPreferences.cardWidth,
    ),
    font: normalizeEnumValue(value?.font, ["serif", "sans"], defaultUiPreferences.font),
    lineHeight: normalizeEnumValue(
      value?.lineHeight,
      ["compact", "relaxed"],
      defaultUiPreferences.lineHeight,
    ),
    scrollPan: normalizeEnumValue(
      value?.scrollPan,
      ["enabled", "disabled"],
      defaultUiPreferences.scrollPan,
    ),
    textSize: normalizeEnumValue(
      value?.textSize,
      ["comfortable", "large"],
      defaultUiPreferences.textSize,
    ),
    theme: normalizeEnumValue(normalizedThemeValue, ["light", "dark"], defaultUiPreferences.theme),
  };
}

export function resolveUiMetrics(preferences: UiPreferences) {
  return {
    cardHeight: uiTokens.cardHeight,
    cardWidth: cardWidthTokens[preferences.cardWidth],
    spacing: uiTokens.spacing,
  };
}

function buildCssVariables(preferences: UiPreferences): CssVariableMap {
  const theme = themeTokens[preferences.theme];
  const fonts = fontTokens[preferences.font];
  const metrics = resolveUiMetrics(preferences);

  return {
    "--fc-animation-easing": uiTokens.animationEasing,
    "--fc-animation-ms": `${uiTokens.animationMs}ms`,
    "--fc-card-height": `${metrics.cardHeight}px`,
    "--fc-card-width": `${metrics.cardWidth}px`,
    "--fc-color-app": theme.app,
    "--fc-color-border": theme.border,
    "--fc-color-border-strong": theme.borderStrong,
    "--fc-color-focus": theme.focus,
    "--fc-color-muted": theme.muted,
    "--fc-color-on-dark": theme.onDark,
    "--fc-color-overlay-backdrop": theme.overlayBackdrop,
    "--fc-color-surface": theme.surface,
    "--fc-color-surface-strong": theme.surfaceStrong,
    "--fc-color-text": theme.text,
    "--fc-content-line-height": lineHeightTokens[preferences.lineHeight],
    "--fc-content-size": textSizeTokens[preferences.textSize],
    "--fc-font-content": fonts.content,
    "--fc-font-ui": fonts.ui,
    "--fc-radius-card": `${uiTokens.radius.card}px`,
    "--fc-radius-pill": `${uiTokens.radius.pill}px`,
    "--fc-shadow-card": uiTokens.shadows.card,
    "--fc-shadow-elevated": uiTokens.shadows.elevated,
    "--fc-shadow-soft": uiTokens.shadows.soft,
    "--fc-spacing": `${uiTokens.spacing}px`,
  };
}

export function applyUiTokens(preferences: UiPreferences = defaultUiPreferences) {
  const root = document.documentElement;

  Object.entries(buildCssVariables(preferences)).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export { defaultUiPreferences, uiTokens };
