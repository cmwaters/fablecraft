import { EMPTY_EDITOR_DOCUMENT_JSON } from "../src/domain/document/editorDocument";
import {
  canCreateCardsFromContent,
  contentJsonForPlainText,
  contentText,
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
});
