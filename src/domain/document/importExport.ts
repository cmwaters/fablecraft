import { EMPTY_EDITOR_DOCUMENT_JSON } from "./editorDocument";
import { cardContent, isContentEffectivelyEmpty } from "./content";
import { treeLayout } from "./spatial";
import type { DocumentSnapshot } from "./types";

interface EditorMark {
  attrs?: Record<string, unknown>;
  type?: string;
}

interface EditorNode {
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  marks?: EditorMark[];
  text?: string;
  type?: string;
}

export type ExportFormat = "html" | "markdown";

function createTextNode(text: string, marks?: EditorMark[]): EditorNode {
  return {
    ...(marks && marks.length > 0 ? { marks } : {}),
    text,
    type: "text",
  };
}

function pushMarkedText(
  nodes: EditorNode[],
  text: string,
  marks: EditorMark[] = [],
) {
  if (!text) {
    return;
  }

  nodes.push(createTextNode(text, marks));
}

function parseInline(text: string, inheritedMarks: EditorMark[] = []): EditorNode[] {
  const nodes: EditorNode[] = [];
  let index = 0;

  function appendNestedText(
    prefixLength: number,
    suffixLength: number,
    type: string,
    attrs?: Record<string, unknown>,
  ) {
    const closingIndex = text.indexOf(text.slice(index, index + prefixLength), index + prefixLength);

    if (closingIndex === -1) {
      return false;
    }

    const innerText = text.slice(index + prefixLength, closingIndex);

    if (!innerText) {
      return false;
    }

    nodes.push(
      ...parseInline(innerText, inheritedMarks.concat({ ...(attrs ? { attrs } : {}), type })),
    );
    index = closingIndex + suffixLength;
    return true;
  }

  while (index < text.length) {
    if (text.startsWith("**", index) && appendNestedText(2, 2, "bold")) {
      continue;
    }

    if (text.startsWith("__", index) && appendNestedText(2, 2, "bold")) {
      continue;
    }

    if (text.startsWith("~~", index) && appendNestedText(2, 2, "strike")) {
      continue;
    }

    if (text.startsWith("*", index) && appendNestedText(1, 1, "italic")) {
      continue;
    }

    if (text.startsWith("_", index) && appendNestedText(1, 1, "italic")) {
      continue;
    }

    if (text.startsWith("`", index)) {
      const closingIndex = text.indexOf("`", index + 1);

      if (closingIndex !== -1) {
        pushMarkedText(
          nodes,
          text.slice(index + 1, closingIndex),
          inheritedMarks.concat({ type: "code" }),
        );
        index = closingIndex + 1;
        continue;
      }
    }

    if (text.startsWith("[", index)) {
      const closingBracketIndex = text.indexOf("]", index + 1);
      const openingParenIndex =
        closingBracketIndex === -1
          ? -1
          : text.indexOf("(", closingBracketIndex + 1);
      const closingParenIndex =
        openingParenIndex === -1 ? -1 : text.indexOf(")", openingParenIndex + 1);

      if (
        closingBracketIndex !== -1 &&
        openingParenIndex === closingBracketIndex + 1 &&
        closingParenIndex !== -1
      ) {
        nodes.push(
          ...parseInline(
            text.slice(index + 1, closingBracketIndex),
            inheritedMarks.concat({
              attrs: { href: text.slice(openingParenIndex + 1, closingParenIndex) },
              type: "link",
            }),
          ),
        );
        index = closingParenIndex + 1;
        continue;
      }
    }

    let nextIndex = text.length;

    ["**", "__", "~~", "*", "_", "`", "["].forEach((marker) => {
      const markerIndex = text.indexOf(marker, index + 1);

      if (markerIndex !== -1) {
        nextIndex = Math.min(nextIndex, markerIndex);
      }
    });

    pushMarkedText(nodes, text.slice(index, nextIndex), inheritedMarks);
    index = nextIndex;
  }

  return nodes;
}

function paragraphNodeFromLines(lines: string[]): EditorNode {
  const content: EditorNode[] = [];

  lines.forEach((line, index) => {
    content.push(...parseInline(line));

    if (index < lines.length - 1) {
      content.push({ type: "hardBreak" });
    }
  });

  return {
    ...(content.length > 0 ? { content } : {}),
    type: "paragraph",
  };
}

function listItemNode(text: string): EditorNode {
  return {
    content: [paragraphNodeFromLines([text])],
    type: "listItem",
  };
}

function parseMarkdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: EditorNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index] ?? "";

    if (!currentLine.trim()) {
      index += 1;
      continue;
    }

    if (currentLine.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      if (index < lines.length && (lines[index] ?? "").startsWith("```")) {
        index += 1;
      }

      blocks.push({
        content: [createTextNode(codeLines.join("\n"))],
        type: "codeBlock",
      });
      continue;
    }

    const headingMatch = currentLine.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      blocks.push({
        attrs: { level: Math.min(3, headingMatch[1]!.length) },
        content: parseInline(headingMatch[2] ?? ""),
        type: "heading",
      });
      index += 1;
      continue;
    }

    if (currentLine.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length) {
        const quoteLine = lines[index] ?? "";

        if (!quoteLine.startsWith(">")) {
          break;
        }

        quoteLines.push(quoteLine.replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        content: [paragraphNodeFromLines(quoteLines)],
        type: "blockquote",
      });
      continue;
    }

    const bulletMatch = currentLine.match(/^[-*+]\s+(.*)$/);
    const orderedMatch = currentLine.match(/^\d+\.\s+(.*)$/);

    if (bulletMatch || orderedMatch) {
      const items: EditorNode[] = [];
      const ordered = Boolean(orderedMatch);

      while (index < lines.length) {
        const listLine = lines[index] ?? "";
        const match = ordered
          ? listLine.match(/^\d+\.\s+(.*)$/)
          : listLine.match(/^[-*+]\s+(.*)$/);

        if (!match) {
          break;
        }

        items.push(listItemNode(match[1] ?? ""));
        index += 1;
      }

      blocks.push({
        content: items,
        type: ordered ? "orderedList" : "bulletList",
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const line = lines[index] ?? "";

      if (
        !line.trim() ||
        /^(#{1,6})\s+/.test(line) ||
        /^[-*+]\s+/.test(line) ||
        /^\d+\.\s+/.test(line) ||
        line.startsWith(">") ||
        line.startsWith("```")
      ) {
        break;
      }

      paragraphLines.push(line);
      index += 1;
    }

    blocks.push(paragraphNodeFromLines(paragraphLines));
  }

  return blocks;
}

function parseContent(contentJson: string): EditorNode | null {
  try {
    return JSON.parse(contentJson) as EditorNode;
  } catch {
    return null;
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdownFromNodes(nodes: EditorNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        const baseText = node.text ?? "";

        return (node.marks ?? []).reduceRight((content, mark) => {
          if (mark.type === "bold") {
            return `**${content}**`;
          }

          if (mark.type === "italic") {
            return `*${content}*`;
          }

          if (mark.type === "strike") {
            return `~~${content}~~`;
          }

          if (mark.type === "code") {
            return `\`${content}\``;
          }

          if (mark.type === "link") {
            return `[${content}](${String(mark.attrs?.href ?? "")})`;
          }

          return content;
        }, baseText);
      }

      if (node.type === "hardBreak") {
        return "\n";
      }

      return inlineMarkdownFromNodes(node.content ?? []);
    })
    .join("");
}

function markdownFromBlock(node: EditorNode): string {
  if (node.type === "paragraph") {
    return inlineMarkdownFromNodes(node.content);
  }

  if (node.type === "heading") {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 1)));
    return `${"#".repeat(level)} ${inlineMarkdownFromNodes(node.content)}`.trimEnd();
  }

  if (node.type === "bulletList") {
    return (node.content ?? [])
      .map((item) => `- ${markdownFromListItem(item)}`)
      .join("\n");
  }

  if (node.type === "orderedList") {
    return (node.content ?? [])
      .map((item, index) => `${index + 1}. ${markdownFromListItem(item)}`)
      .join("\n");
  }

  if (node.type === "blockquote") {
    return markdownFromChildren(node.content).split("\n").map((line) => `> ${line}`).join("\n");
  }

  if (node.type === "codeBlock") {
    return `\`\`\`\n${inlineMarkdownFromNodes(node.content)}\n\`\`\``;
  }

  return markdownFromChildren(node.content);
}

function markdownFromListItem(node: EditorNode) {
  return markdownFromChildren(node.content).replace(/\n/g, "\n  ").trimEnd();
}

function markdownFromChildren(nodes: EditorNode[] = []) {
  return nodes.map((node) => markdownFromBlock(node)).join("\n\n");
}

function inlineHtmlFromNodes(nodes: EditorNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        const baseText = escapeHtml(node.text ?? "");

        return (node.marks ?? []).reduceRight((content, mark) => {
          if (mark.type === "bold") {
            return `<strong>${content}</strong>`;
          }

          if (mark.type === "italic") {
            return `<em>${content}</em>`;
          }

          if (mark.type === "strike") {
            return `<s>${content}</s>`;
          }

          if (mark.type === "code") {
            return `<code>${content}</code>`;
          }

          if (mark.type === "link") {
            return `<a href="${escapeHtml(String(mark.attrs?.href ?? ""))}">${content}</a>`;
          }

          return content;
        }, baseText);
      }

      if (node.type === "hardBreak") {
        return "<br />";
      }

      return htmlFromChildren(node.content);
    })
    .join("");
}

function htmlFromBlock(node: EditorNode): string {
  if (node.type === "paragraph") {
    return `<p>${inlineHtmlFromNodes(node.content)}</p>`;
  }

  if (node.type === "heading") {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 1)));
    return `<h${level}>${inlineHtmlFromNodes(node.content)}</h${level}>`;
  }

  if (node.type === "bulletList") {
    return `<ul>${(node.content ?? []).map((item) => `<li>${htmlFromChildren(item.content)}</li>`).join("")}</ul>`;
  }

  if (node.type === "orderedList") {
    return `<ol>${(node.content ?? []).map((item) => `<li>${htmlFromChildren(item.content)}</li>`).join("")}</ol>`;
  }

  if (node.type === "blockquote") {
    return `<blockquote>${htmlFromChildren(node.content)}</blockquote>`;
  }

  if (node.type === "codeBlock") {
    return `<pre><code>${escapeHtml(inlineMarkdownFromNodes(node.content))}</code></pre>`;
  }

  return htmlFromChildren(node.content);
}

function htmlFromChildren(nodes: EditorNode[] = []) {
  return nodes.map((node) => htmlFromBlock(node)).join("");
}

function cardDepths(snapshot: DocumentSnapshot) {
  const depthByCardId = new Map<string, number>();

  function depthForCard(cardId: string): number {
    const cachedDepth = depthByCardId.get(cardId);

    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    const card = snapshot.cards.find((entry) => entry.id === cardId);

    if (!card) {
      return 0;
    }

    const depth = card.parentId ? depthForCard(card.parentId) + 1 : 0;
    depthByCardId.set(cardId, depth);
    return depth;
  }

  snapshot.cards.forEach((card) => {
    depthForCard(card.id);
  });

  return depthByCardId;
}

function treeOrderedCardsAtDepth(
  snapshot: DocumentSnapshot,
  depthByCardId: Map<string, number>,
  depth: number,
) {
  return treeLayout(snapshot.cards)
    .filter((position) => (depthByCardId.get(position.cardId) ?? 0) === depth)
    .map((position) => position.cardId);
}

export function markdownToContentJson(markdown: string) {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n").trim();

  if (!normalizedMarkdown) {
    return EMPTY_EDITOR_DOCUMENT_JSON;
  }

  return JSON.stringify({
    content: parseMarkdownBlocks(normalizedMarkdown),
    type: "doc",
  });
}

export function contentJsonToMarkdown(contentJson: string) {
  const document = parseContent(contentJson);

  if (!document?.content?.length) {
    return "";
  }

  return markdownFromChildren(document.content).trim();
}

export function contentJsonToHtml(contentJson: string) {
  const document = parseContent(contentJson);

  if (!document?.content?.length) {
    return "";
  }

  return htmlFromChildren(document.content).trim();
}

export function exportLevel(
  snapshot: DocumentSnapshot,
  layerId: string,
  depth: number,
  format: ExportFormat,
) {
  const depthByCardId = cardDepths(snapshot);
  const cardsAtDepth = treeOrderedCardsAtDepth(snapshot, depthByCardId, depth)
    .map((cardId) => ({
      cardId,
      contentJson: cardContent(snapshot, cardId, layerId),
    }))
    .filter((card) => !isContentEffectivelyEmpty(card.contentJson));

  const parts = cardsAtDepth.map((card) =>
    format === "markdown"
      ? contentJsonToMarkdown(card.contentJson)
      : contentJsonToHtml(card.contentJson),
  );

  return {
    content:
      format === "markdown"
        ? parts.join("\n\n---\n\n").trim()
        : parts.join("\n<hr />\n").trim(),
    depth,
    format,
    cardCount: cardsAtDepth.length,
  };
}

export function exportCurrentLevel(
  snapshot: DocumentSnapshot,
  layerId: string,
  activeCardId: string,
  format: ExportFormat,
) {
  const depthByCardId = cardDepths(snapshot);
  const depth = depthByCardId.get(activeCardId) ?? 0;
  return exportLevel(snapshot, layerId, depth, format);
}
