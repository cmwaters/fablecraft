import {
  contentJsonToHtml,
  contentJsonToMarkdown,
  exportCurrentLevel,
  markdownToContentJson,
} from "../src/domain/document/importExport";
import { replaceCardContent } from "../src/domain/document/content";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document import/export", () => {
  it("imports markdown into heading and list blocks", () => {
    const contentJson = markdownToContentJson(
      "# Hello World\n\n- First point\n- Second point",
    );

    expect(contentJsonToMarkdown(contentJson)).toBe(
      "# Hello World\n\n- First point\n- Second point",
    );
  });

  it("serializes content as html", () => {
    const contentJson = markdownToContentJson("## Heading\n\n1. First item");

    expect(contentJsonToHtml(contentJson)).toBe(
      "<h2>Heading</h2><ol><li><p>First item</p></li></ol>",
    );
  });

  it("exports the currently selected level in tree order", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot.cards.push(
      {
        documentId: "doc-1",
        id: "card-a-1",
        orderIndex: 0,
        parentId: "card-a",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-b-1",
        orderIndex: 0,
        parentId: "card-b",
        type: "card",
      },
    );
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: markdownToContentJson("Act 1"),
    });
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-b",
      contentJson: markdownToContentJson("Act 2"),
    });
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a-1",
      contentJson: markdownToContentJson("## Act 1"),
    });
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-b-1",
      contentJson: markdownToContentJson("- Ending beat"),
    });

    expect(exportCurrentLevel(snapshot, "card-b", "markdown")).toEqual({
      cardCount: 2,
      content: "Act 1\n\n---\n\nAct 2",
      depth: 1,
      format: "markdown",
    });
  });
});
