import {
  firstChildCardId,
  nextSiblingCardId,
  nextVisibleCardId,
  parentCardId,
  previousSiblingCardId,
  previousVisibleCardId,
  visibleCardIds,
} from "../src/domain/document/navigation";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document navigation", () => {
  it("walks visible cards in preorder for unbalanced trees", () => {
    const snapshot = makeDocumentSnapshot();
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
        id: "card-a-2",
        orderIndex: 1,
        parentId: "card-a",
        type: "card",
      },
    );

    expect(visibleCardIds(snapshot.cards)).toEqual([
      "card-root",
      "card-a",
      "card-a-1",
      "card-a-2",
      "card-b",
    ]);
  });

  it("resolves parent and first-child movement", () => {
    const snapshot = makeDocumentSnapshot();

    expect(parentCardId(snapshot.cards, "card-a")).toBe("card-root");
    expect(firstChildCardId(snapshot.cards, "card-root")).toBe("card-a");
  });

  it("moves up and down across uneven branches", () => {
    const snapshot = makeDocumentSnapshot();
    snapshot.cards.push({
      documentId: "doc-1",
      id: "card-a-1",
      orderIndex: 0,
      parentId: "card-a",
      type: "card",
    });

    expect(nextVisibleCardId(snapshot.cards, "card-a")).toBe("card-a-1");
    expect(nextVisibleCardId(snapshot.cards, "card-a-1")).toBe("card-b");
    expect(previousVisibleCardId(snapshot.cards, "card-b")).toBe("card-a-1");
  });

  it("moves up and down through siblings without dropping into children", () => {
    const snapshot = makeDocumentSnapshot();
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
        id: "card-a-2",
        orderIndex: 1,
        parentId: "card-a",
        type: "card",
      },
    );

    expect(nextSiblingCardId(snapshot.cards, "card-a")).toBe("card-b");
    expect(previousSiblingCardId(snapshot.cards, "card-b")).toBe("card-a");
    expect(nextSiblingCardId(snapshot.cards, "card-a-1")).toBe("card-a-2");
    expect(previousSiblingCardId(snapshot.cards, "card-a-1")).toBeNull();
  });
});
