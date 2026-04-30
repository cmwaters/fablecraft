import { EMPTY_EDITOR_DOCUMENT_JSON } from "./editorDocument";
import { normalizeDocumentSnapshot } from "./serialization";
import type { CardContentRecord, DocumentSnapshot } from "./types";

interface EditorNode {
  content?: EditorNode[];
  text?: string;
  type?: string;
}

function parseContent(contentJson: string): EditorNode | null {
  try {
    return JSON.parse(contentJson) as EditorNode;
  } catch {
    return null;
  }
}

function collectText(node: EditorNode | null): string {
  if (!node) {
    return "";
  }

  if (node.type === "doc") {
    return (node.content ?? []).map((child) => collectText(child)).join("\n\n");
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? []).map((child) => collectText(child)).join("\n");
  }

  if (node.type === "listItem") {
    const itemText = (node.content ?? []).map((child) => collectText(child)).join("\n");
    const lines = itemText
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line, index, array) => line.length > 0 || index < array.length - 1);

    return lines
      .map((line, index) => (index === 0 ? `- ${line.trimStart()}` : `  ${line}`))
      .join("\n");
  }

  const ownText = node.text ?? "";
  const childText = (node.content ?? []).map((child) => collectText(child)).join("");

  return `${ownText}${childText}`;
}

export function contentText(contentJson: string) {
  return collectText(parseContent(contentJson)).replace(/\n{3,}/g, "\n\n");
}

export function isContentEffectivelyEmpty(contentJson: string) {
  return contentText(contentJson).trim().length === 0;
}

export function canCreateCardsFromContent(contentJson: string) {
  return !isContentEffectivelyEmpty(contentJson);
}

export function contentPreview(contentJson: string, maxLength = 96) {
  const text = contentText(contentJson).replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text || "Empty card";
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function contentJsonForPlainText(text: string) {
  const normalizedText = text.replace(/\r\n/g, "\n");

  if (!normalizedText.trim()) {
    return EMPTY_EDITOR_DOCUMENT_JSON;
  }

  return JSON.stringify({
    content: normalizedText.split(/\n{2,}/).map((paragraph) => ({
      content: paragraph
        .split("\n")
        .filter(Boolean)
        .map((line, index, lines) => ({
          text: index < lines.length - 1 ? `${line}\n` : line,
          type: "text",
        })),
      type: "paragraph",
    })),
    type: "doc",
  });
}

export function mergeCardContentJson(
  leadingContentJson: string,
  trailingContentJson: string,
) {
  const leadingIsEmpty = isContentEffectivelyEmpty(leadingContentJson);
  const trailingIsEmpty = isContentEffectivelyEmpty(trailingContentJson);

  if (leadingIsEmpty && trailingIsEmpty) {
    return EMPTY_EDITOR_DOCUMENT_JSON;
  }

  if (leadingIsEmpty) {
    return trailingContentJson;
  }

  if (trailingIsEmpty) {
    return leadingContentJson;
  }

  const leadingDocument = parseContent(leadingContentJson);
  const trailingDocument = parseContent(trailingContentJson);

  if (leadingDocument?.type === "doc" && trailingDocument?.type === "doc") {
    return JSON.stringify({
      content: [
        ...(leadingDocument.content ?? []),
        ...(trailingDocument.content ?? []),
      ],
      type: "doc",
    });
  }

  return contentJsonForPlainText(
    `${contentText(leadingContentJson)}\n\n${contentText(trailingContentJson)}`,
  );
}

export function trimTrailingEmptyParagraphs(contentJson: string) {
  const document = parseContent(contentJson);

  if (document?.type !== "doc") {
    return contentJson;
  }

  const trimmedContent = [...(document.content ?? [])];

  while (trimmedContent.length > 0) {
    const lastNode = trimmedContent[trimmedContent.length - 1];

    if (collectText(lastNode ?? null).trim().length > 0) {
      break;
    }

    trimmedContent.pop();
  }

  if (trimmedContent.length === 0) {
    return EMPTY_EDITOR_DOCUMENT_JSON;
  }

  return JSON.stringify({
    ...document,
    content: trimmedContent,
  });
}

export function cardContent(
  snapshot: DocumentSnapshot,
  cardId: string,
) {
  return (
    snapshot.contents.find((content) => content.cardId === cardId)?.contentJson ??
    EMPTY_EDITOR_DOCUMENT_JSON
  );
}

export function replaceCardContent(
  snapshot: DocumentSnapshot,
  nextRecord: CardContentRecord,
) {
  const existingIndex = snapshot.contents.findIndex(
    (content) => content.cardId === nextRecord.cardId,
  );

  const nextContents =
    existingIndex === -1
      ? snapshot.contents.concat(nextRecord)
      : snapshot.contents.map((content, index) =>
          index === existingIndex ? nextRecord : content,
        );

  return normalizeDocumentSnapshot({
    ...snapshot,
    contents: nextContents,
  });
}
