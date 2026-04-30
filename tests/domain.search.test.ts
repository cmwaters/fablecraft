import { contentJsonForPlainText, replaceCardContent } from "../src/domain/document/content";
import { searchDocument } from "../src/domain/document/search";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document search", () => {
  it("returns only cards that match the query in the document", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Alpha scene"),
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

  it("treats regex metacharacters as literal substrings", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Before (parens) after."),
    });
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-b",
      contentJson: contentJsonForPlainText("Wild*card* and .dot pattern"),
    });

    const parenResults = searchDocument(snapshot, "(parens)");
    const starResults = searchDocument(snapshot, "*card*");
    const dotResults = searchDocument(snapshot, ".dot");

    expect(parenResults.map((result) => result.cardId)).toEqual(["card-a"]);
    expect(starResults.map((result) => result.cardId)).toEqual(["card-b"]);
    expect(dotResults.map((result) => result.cardId)).toEqual(["card-b"]);
  });

  it("matches case-insensitively across diacritics and emoji", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Café résumé 🔥"),
    });

    expect(searchDocument(snapshot, "CAFÉ").map((result) => result.cardId)).toEqual([
      "card-a",
    ]);
    expect(searchDocument(snapshot, "🔥").map((result) => result.cardId)).toEqual([
      "card-a",
    ]);
  });
});
