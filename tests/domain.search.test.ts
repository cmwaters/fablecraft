import { contentJsonForPlainText, replaceCardContent } from "../src/domain/document/content";
import { searchDocument } from "../src/domain/document/search";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document search", () => {
  it("returns only cards that match the query in the document", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Alpha scene"),
      layerId: "layer-base",
    });

    expect(searchDocument(snapshot, "scene")).toEqual([
      {
        cardId: "card-a",
        cardLabel: "B01",
        excerpt: "Alpha scene",
        matchIndex: 6,
      },
    ]);
  });

  it("returns an empty list for blank queries", () => {
    const snapshot = makeDocumentSnapshot();

    expect(searchDocument(snapshot, "   ")).toEqual([]);
  });
});
