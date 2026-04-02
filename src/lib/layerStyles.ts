import type { LayerColor } from "../domain/document/types";

const layerColorVariables: Record<LayerColor, string> = {
  blue: "var(--fc-layer-blue)",
  green: "var(--fc-layer-green)",
  neutral: "var(--fc-layer-base)",
  orange: "var(--fc-layer-orange)",
  purple: "var(--fc-layer-purple)",
  red: "var(--fc-layer-red)",
  yellow: "var(--fc-layer-yellow)",
};

export function layerBorderColor(color: LayerColor) {
  return layerColorVariables[color];
}

