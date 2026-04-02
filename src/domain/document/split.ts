import { contentJsonForPlainText, contentText } from "./content";

export interface SplitCardContent {
  after: string;
  before: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function splitCardContentAtTextOffset(
  contentJson: string,
  selectionStart: number,
  selectionEnd: number,
): SplitCardContent {
  const text = contentText(contentJson);
  const normalizedStart = clamp(selectionStart, 0, text.length);
  const normalizedEnd = clamp(selectionEnd, normalizedStart, text.length);
  const before = text.slice(0, normalizedStart).replace(/\s+$/, "");
  const after = text.slice(normalizedEnd).replace(/^\s+/, "");

  return {
    after: contentJsonForPlainText(after),
    before: contentJsonForPlainText(before),
  };
}

