import { EMPTY_EDITOR_DOCUMENT_JSON } from "../src/domain/document/editorDocument";
import {
  canCreateCardsFromContent,
  contentJsonForPlainText,
  contentPreview,
  contentText,
  mergeCardContentJson,
  trimTrailingEmptyParagraphs,
} from "../src/domain/document/content";

describe("document content rules", () => {
  it("prevents structural card creation from empty content", () => {
    expect(canCreateCardsFromContent(EMPTY_EDITOR_DOCUMENT_JSON)).toBe(false);
  });

  it("allows structural card creation from non-empty content", () => {
    expect(canCreateCardsFromContent(contentJsonForPlainText("Hello world"))).toBe(true);
  });

  it("preserves paragraph breaks when deriving plain text previews", () => {
    const contentJson = JSON.stringify({
      content: [
        {
          content: [{ text: "Hello World", type: "text" }],
          type: "paragraph",
        },
        {
          content: [{ text: "This is a series of points I wanted to talk about:", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    });

    expect(contentText(contentJson)).toBe(
      "Hello World\n\nThis is a series of points I wanted to talk about:",
    );
  });

  it("keeps heading and list structure readable in previews", () => {
    const contentJson = JSON.stringify({
      content: [
        {
          attrs: { level: 2 },
          content: [{ text: "Plan", type: "text" }],
          type: "heading",
        },
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "First point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [{ text: "Second point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
          ],
          type: "bulletList",
        },
      ],
      type: "doc",
    });

    expect(contentText(contentJson)).toBe("Plan\n\n- First point\n- Second point");
  });

  it("treats malformed JSON as empty content without throwing", () => {
    expect(contentText("not valid json")).toBe("");
    expect(contentText("")).toBe("");
    expect(canCreateCardsFromContent("not valid json")).toBe(false);
    expect(contentPreview("not valid json")).toBe("Empty card");
  });

  it("treats a JSON document without the expected doc wrapper as empty", () => {
    const strayArray = JSON.stringify([{ type: "paragraph" }]);
    const nonDocObject = JSON.stringify({ type: "paragraph", text: "stray" });

    expect(contentText(strayArray)).toBe("");
    expect(contentText(nonDocObject)).toBe("stray");
  });

  it("tolerates nodes that are missing their content array", () => {
    const contentJson = JSON.stringify({
      content: [
        { type: "paragraph" },
        { content: [{ text: "Hello", type: "text" }], type: "paragraph" },
      ],
      type: "doc",
    });

    expect(contentText(contentJson)).toBe("\n\nHello");
  });

  it("round-trips Unicode and multi-paragraph plain text without corruption", () => {
    const source = "emoji 🔥 surrogate 𝄞 ümlaut\n\nsecond paragraph";
    const roundTripped = contentText(contentJsonForPlainText(source));

    expect(roundTripped).toBe(source);
  });

  it("serializes very large plain text without hanging or truncating", () => {
    const hugeParagraph = "a".repeat(50_000);

    const contentJson = contentJsonForPlainText(hugeParagraph);
    const roundTripped = contentText(contentJson);

    expect(roundTripped.length).toBe(hugeParagraph.length);
    expect(roundTripped.startsWith("aaaa")).toBe(true);
  });

  it("merges two doc snapshots by concatenating their paragraph lists", () => {
    const leading = contentJsonForPlainText("Leading line");
    const trailing = contentJsonForPlainText("Trailing line");

    const merged = mergeCardContentJson(leading, trailing);

    expect(contentText(merged)).toBe("Leading line\n\nTrailing line");
  });

  it("returns the EMPTY document when merging two empty contents", () => {
    expect(
      mergeCardContentJson(EMPTY_EDITOR_DOCUMENT_JSON, EMPTY_EDITOR_DOCUMENT_JSON),
    ).toBe(EMPTY_EDITOR_DOCUMENT_JSON);
  });

  it("falls back to plain text merge when either side is not a doc", () => {
    const merged = mergeCardContentJson("not valid json", contentJsonForPlainText("After"));

    expect(contentText(merged)).toBe("After");
  });

  it("trims trailing empty paragraphs while preserving the last meaningful one", () => {
    const contentJson = JSON.stringify({
      content: [
        { content: [{ text: "Keep", type: "text" }], type: "paragraph" },
        { type: "paragraph" },
        { type: "paragraph" },
      ],
      type: "doc",
    });

    const trimmed = trimTrailingEmptyParagraphs(contentJson);

    expect(contentText(trimmed)).toBe("Keep");
  });

  it("returns the EMPTY document when trimming leaves nothing behind", () => {
    const onlyBlanks = JSON.stringify({
      content: [{ type: "paragraph" }, { type: "paragraph" }],
      type: "doc",
    });

    expect(trimTrailingEmptyParagraphs(onlyBlanks)).toBe(EMPTY_EDITOR_DOCUMENT_JSON);
  });
});
