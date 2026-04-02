import {
  ancestorsOfCard,
  childrenOfCard,
  nextCardInColumn,
  previousCardInColumn,
  siblingsOfCard,
  stageLayout,
  treeLayout,
} from "../src/domain/document/spatial";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document spatial helpers", () => {
  it("returns ancestor chain from root toward the parent", () => {
    const snapshot = makeDocumentSnapshot();
    snapshot.cards.push({
      documentId: "doc-1",
      id: "card-a-1",
      orderIndex: 0,
      parentId: "card-a",
      type: "card",
    });

    expect(ancestorsOfCard(snapshot.cards, "card-a-1").map((card) => card.id)).toEqual([
      "card-root",
      "card-a",
    ]);
  });

  it("returns siblings including the active card in order", () => {
    const snapshot = makeDocumentSnapshot();

    expect(siblingsOfCard(snapshot.cards, "card-b").map((card) => card.id)).toEqual([
      "card-a",
      "card-b",
    ]);
  });

  it("returns immediate children in order", () => {
    const snapshot = makeDocumentSnapshot();

    expect(childrenOfCard(snapshot.cards, "card-root").map((card) => card.id)).toEqual([
      "card-a",
      "card-b",
    ]);
  });

  it("assigns positions to every card in the tree", () => {
    const snapshot = makeDocumentSnapshot();
    snapshot.cards.push({
      documentId: "doc-1",
      id: "card-a-1",
      orderIndex: 0,
      parentId: "card-a",
      type: "card",
    });

    expect(treeLayout(snapshot.cards)).toEqual([
      { cardId: "card-root", column: 0, row: 0 },
      { cardId: "card-a", column: 1, row: 0 },
      { cardId: "card-b", column: 1, row: 1 },
      { cardId: "card-a-1", column: 2, row: 0 },
    ]);
  });

  it("moves vertically within the current column", () => {
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
        id: "card-c",
        orderIndex: 2,
        parentId: "card-root",
        type: "card",
      },
    );

    expect(nextCardInColumn(snapshot.cards, "card-a")).toBe("card-b");
    expect(nextCardInColumn(snapshot.cards, "card-b")).toBe("card-c");
    expect(previousCardInColumn(snapshot.cards, "card-c")).toBe("card-b");
  });

  it("aligns the parent and pins the first child to the active card", () => {
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

    const positioned = stageLayout(snapshot.cards, "card-a", {
      activeCardHeight: 220,
      cardHeight: 104,
      cardWidth: 468,
      spacing: 24,
    });

    expect(positioned.find((card) => card.cardId === "card-root")?.y).toBe(0);
    expect(positioned.find((card) => card.cardId === "card-a-1")?.y).toBe(0);
    expect(positioned.find((card) => card.cardId === "card-a-2")?.y).toBe(128);
  });

  it("keeps column spacing from overlapping a tall active card", () => {
    const snapshot = makeDocumentSnapshot();
    snapshot.cards.push({
      documentId: "doc-1",
      id: "card-c",
      orderIndex: 2,
      parentId: "card-root",
      type: "card",
    });

    const positioned = stageLayout(snapshot.cards, "card-b", {
      activeCardHeight: 260,
      cardHeight: 104,
      cardWidth: 468,
      spacing: 24,
    });

    expect(positioned.find((card) => card.cardId === "card-a")?.y).toBe(-206);
    expect(positioned.find((card) => card.cardId === "card-c")?.y).toBe(206);
  });

  it("keeps non-active child groups reasonably coherent around their own parent", () => {
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
        id: "card-b-1",
        orderIndex: 0,
        parentId: "card-b",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-b-2",
        orderIndex: 1,
        parentId: "card-b",
        type: "card",
      },
    );

    const positioned = stageLayout(snapshot.cards, "card-a-1", {
      cardHeight: 84,
      cardWidth: 468,
      spacing: 24,
    });
    const b = positioned.find((card) => card.cardId === "card-b")!;
    const b1 = positioned.find((card) => card.cardId === "card-b-1")!;
    const b2 = positioned.find((card) => card.cardId === "card-b-2")!;

    expect(Math.abs((b1.y + b2.y) / 2 - b.y)).toBeLessThanOrEqual(90);
  });

  it("pins the first active child to the selected card and stacks the rest below", () => {
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
      {
        documentId: "doc-1",
        id: "card-a-3",
        orderIndex: 2,
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

    const positioned = stageLayout(snapshot.cards, "card-a", {
      cardHeight: 84,
      cardWidth: 468,
      spacing: 24,
    });

    expect(positioned.find((card) => card.cardId === "card-a-1")?.y).toBe(0);
    expect(positioned.find((card) => card.cardId === "card-a-2")?.y).toBe(108);
    expect(positioned.find((card) => card.cardId === "card-a-3")?.y).toBe(216);
    expect(positioned.find((card) => card.cardId === "card-b-1")?.y).toBeGreaterThanOrEqual(324);
  });

  it("keeps a sibling-above child above the active child group after the active column repack", () => {
    const snapshot = makeDocumentSnapshot();
    snapshot.cards.push(
      {
        documentId: "doc-1",
        id: "card-c",
        orderIndex: 2,
        parentId: "card-root",
        type: "card",
      },
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
      {
        documentId: "doc-1",
        id: "card-b-2",
        orderIndex: 1,
        parentId: "card-b",
        type: "card",
      },
    );

    const positioned = stageLayout(snapshot.cards, "card-b", {
      activeCardHeight: 260,
      cardHeight: 84,
      cardHeights: {
        "card-a": 196,
        "card-b": 244,
        "card-c": 228,
        "card-a-1": 132,
        "card-b-1": 120,
        "card-b-2": 156,
      },
      cardWidth: 468,
      spacing: 24,
    });

    expect(positioned.find((card) => card.cardId === "card-a-1")?.y).toBeLessThan(
      positioned.find((card) => card.cardId === "card-b-1")?.y ?? 0,
    );
  });

  it("reflows ancestor columns when centering the active chain", () => {
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
      {
        documentId: "doc-1",
        id: "card-a-2-1",
        orderIndex: 0,
        parentId: "card-a-2",
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

    const positioned = stageLayout(snapshot.cards, "card-a-2-1", {
      cardHeight: 84,
      cardWidth: 468,
      spacing: 24,
    });
    const a = positioned.find((card) => card.cardId === "card-a")!;
    const b = positioned.find((card) => card.cardId === "card-b")!;
    const a2 = positioned.find((card) => card.cardId === "card-a-2")!;
    const b1 = positioned.find((card) => card.cardId === "card-b-1")!;

    expect(a2.y).toBe(0);
    expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(108);
    expect(Math.abs(a2.y - b1.y)).toBeGreaterThanOrEqual(108);
  });

  it("keeps the immediate parent centered even when its sibling column has uneven heights", () => {
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
      {
        documentId: "doc-1",
        id: "card-a-3",
        orderIndex: 2,
        parentId: "card-a",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-a-2-1",
        orderIndex: 0,
        parentId: "card-a-2",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-b-1",
        orderIndex: 0,
        parentId: "card-b",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-b-2",
        orderIndex: 1,
        parentId: "card-b",
        type: "card",
      },
    );

    const positioned = stageLayout(snapshot.cards, "card-a-2-1", {
      cardHeight: 84,
      cardHeights: {
        "card-a-1": 220,
        "card-a-2": 84,
        "card-a-3": 196,
        "card-b-1": 180,
        "card-b-2": 164,
      },
      cardWidth: 468,
      spacing: 24,
    });

    expect(positioned.find((card) => card.cardId === "card-a-2")?.y).toBe(0);
  });

  it("keeps a card's measured height stable when the active selection changes", () => {
    const snapshot = makeDocumentSnapshot();
    const cardHeights = {
      "card-a": 168,
      "card-b": 84,
      "card-root": 84,
    };

    const withACardActive = stageLayout(snapshot.cards, "card-a", {
      cardHeight: 84,
      cardHeights,
      cardWidth: 468,
      spacing: 24,
    });
    const withBCardActive = stageLayout(snapshot.cards, "card-b", {
      cardHeight: 84,
      cardHeights,
      cardWidth: 468,
      spacing: 24,
    });

    expect(withACardActive.find((card) => card.cardId === "card-a")?.height).toBe(168);
    expect(withBCardActive.find((card) => card.cardId === "card-a")?.height).toBe(168);
  });

  it("keeps the selected card centered after the full packing pass", () => {
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
      {
        documentId: "doc-1",
        id: "card-a-3",
        orderIndex: 2,
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
      {
        documentId: "doc-1",
        id: "card-b-2",
        orderIndex: 1,
        parentId: "card-b",
        type: "card",
      },
    );

    const positioned = stageLayout(snapshot.cards, "card-a", {
      activeCardHeight: 340,
      cardHeight: 84,
      cardWidth: 468,
      spacing: 24,
    });

    expect(positioned.find((card) => card.cardId === "card-a")?.y).toBe(0);
  });
});
