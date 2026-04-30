import { EMPTY_EDITOR_DOCUMENT_JSON } from "../src/domain/document/editorDocument";
import { contentJsonForPlainText } from "../src/domain/document/content";
import { createChildCard, createSiblingAfter, createSiblingBefore, deleteCardSubtree, indentCardUnderPreviousSibling, mergeCardWithNextSibling, mergeCardWithPreviousSibling, moveCardWithinParent, outdentCard, unwrapCard, wrapLevelInParent } from "../src/domain/document/tree";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document tree operations", () => {
  it("creates a sibling directly after the target card", () => {
    const snapshot = makeDocumentSnapshot();

    const nextSnapshot = createSiblingAfter(snapshot, "card-a", "card-c");
    const children = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(children.map((card) => card.id)).toEqual(["card-a", "card-c", "card-b"]);
    expect(
      nextSnapshot.contents.find(
        (content) =>
          content.cardId === "card-c",
      )?.contentJson,
    ).toBe(EMPTY_EDITOR_DOCUMENT_JSON);
  });

  it("creates a sibling directly before the target card", () => {
    const snapshot = makeDocumentSnapshot();

    const nextSnapshot = createSiblingBefore(snapshot, "card-b", "card-c");
    const children = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(children.map((card) => card.id)).toEqual(["card-a", "card-c", "card-b"]);
  });

  it("creates a child card with card content", () => {
    const snapshot = makeDocumentSnapshot();

    const nextSnapshot = createChildCard(snapshot, "card-a", "card-a-1");

    expect(nextSnapshot.cards.some((card) => card.id === "card-a-1")).toBe(true);
    expect(
      nextSnapshot.contents.some(
        (content) =>
          content.cardId === "card-a-1",
      ),
    ).toBe(true);
  });

  it("deletes an entire subtree and reindexes siblings", () => {
    const snapshot = createChildCard(makeDocumentSnapshot(), "card-a", "card-a-1");

    const nextSnapshot = deleteCardSubtree(snapshot, "card-a");
    const children = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(nextSnapshot.cards.some((card) => card.id === "card-a")).toBe(false);
    expect(nextSnapshot.cards.some((card) => card.id === "card-a-1")).toBe(false);
    expect(children.map((card) => [card.id, card.orderIndex])).toEqual([["card-b", 0]]);
  });

  it("moves a card within its sibling group", () => {
    const snapshot = makeDocumentSnapshot();

    const nextSnapshot = moveCardWithinParent(snapshot, "card-b", -1);
    const children = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(children.map((card) => card.id)).toEqual(["card-b", "card-a"]);
  });

  it("moves a root card within the root sibling group", () => {
    const snapshot = makeDocumentSnapshot();
    const rootSibling = {
      documentId: "doc-1",
      id: "card-root-2",
      orderIndex: 1,
      parentId: null,
      type: "card" as const,
    };
    const nextSnapshot = moveCardWithinParent(
      {
        ...snapshot,
        cards: snapshot.cards.concat(rootSibling),
        contents: snapshot.contents.concat({
          cardId: rootSibling.id,
          contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
        }),
      },
      "card-root-2",
      -1,
    );
    const roots = nextSnapshot.cards
      .filter((card) => card.parentId === null)
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(roots.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-root-2", 0],
      ["card-root", 1],
    ]);
  });

  it("moves a card into the previous parent group when moving up across a column boundary", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = createChildCard(snapshot, "card-a", "card-a-1");
    snapshot = createChildCard(snapshot, "card-b", "card-b-1");

    const nextSnapshot = moveCardWithinParent(snapshot, "card-b-1", -1);
    const cardAChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-a")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const cardBChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-b")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(cardAChildren.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-b-1", 0],
      ["card-a-1", 1],
    ]);
    expect(cardBChildren).toHaveLength(0);
  });

  it("moves a card into the next parent group when moving down across a column boundary", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = createChildCard(snapshot, "card-a", "card-a-1");
    snapshot = createChildCard(snapshot, "card-b", "card-b-1");

    const nextSnapshot = moveCardWithinParent(snapshot, "card-a-1", 1);
    const cardAChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-a")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const cardBChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-b")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(cardAChildren).toHaveLength(0);
    expect(cardBChildren.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-b-1", 0],
      ["card-a-1", 1],
    ]);
  });

  it("outdents a nested card to its grandparent level", () => {
    const snapshot = createChildCard(makeDocumentSnapshot(), "card-a", "card-a-1");

    const nextSnapshot = outdentCard(snapshot, "card-a-1");
    const rootChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(rootChildren.map((card) => card.id)).toEqual([
      "card-a",
      "card-a-1",
      "card-b",
    ]);
  });

  it("indents a card under the sibling above as its last child", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = createChildCard(snapshot, "card-a", "card-a-1");

    const nextSnapshot = indentCardUnderPreviousSibling(snapshot, "card-b");
    const rootChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const cardAChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-a")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(rootChildren.map((card) => [card.id, card.orderIndex])).toEqual([["card-a", 0]]);
    expect(cardAChildren.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-a-1", 0],
      ["card-b", 1],
    ]);
  });

  it("merges the sibling above into the active card and preserves child order", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = createChildCard(snapshot, "card-a", "card-a-1");
    snapshot = createChildCard(snapshot, "card-b", "card-b-1");
    snapshot = {
      ...snapshot,
      contents: snapshot.contents.map((content) => {
        if (content.cardId === "card-a") {
          return { ...content, contentJson: contentJsonForPlainText("Above") };
        }

        if (content.cardId === "card-b") {
          return { ...content, contentJson: contentJsonForPlainText("Current") };
        }

        return content;
      }),
    };

    const nextSnapshot = mergeCardWithPreviousSibling(snapshot, "card-b");
    const rootChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const mergedChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-b")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const mergedContent = nextSnapshot.contents.find(
      (content) => content.cardId === "card-b",
    )?.contentJson;

    expect(rootChildren.map((card) => [card.id, card.orderIndex])).toEqual([["card-b", 0]]);
    expect(mergedChildren.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-a-1", 0],
      ["card-b-1", 1],
    ]);
    expect(mergedContent).toBe(contentJsonForPlainText("Above\n\nCurrent"));
  });

  it("merges the sibling below into the active card and keeps the active card", () => {
    const seedSnapshot = makeDocumentSnapshot();
    const snapshot = {
      ...seedSnapshot,
      contents: seedSnapshot.contents.map((content) => {
        if (content.cardId === "card-a") {
          return { ...content, contentJson: contentJsonForPlainText("Current") };
        }

        if (content.cardId === "card-b") {
          return { ...content, contentJson: contentJsonForPlainText("Below") };
        }

        return content;
      }),
    };

    const nextSnapshot = mergeCardWithNextSibling(snapshot, "card-a");
    const rootChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const mergedContent = nextSnapshot.contents.find(
      (content) => content.cardId === "card-a",
    )?.contentJson;

    expect(rootChildren.map((card) => [card.id, card.orderIndex])).toEqual([["card-a", 0]]);
    expect(mergedContent).toBe(contentJsonForPlainText("Current\n\nBelow"));
  });

  it("wraps a whole sibling level in a new parent card", () => {
    const snapshot = makeDocumentSnapshot();

    const nextSnapshot = wrapLevelInParent(snapshot, "card-a", "card-parent");
    const rootChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const wrappedChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-parent")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(rootChildren.map((card) => card.id)).toEqual(["card-parent"]);
    expect(wrappedChildren.map((card) => card.id)).toEqual(["card-a", "card-b"]);
    expect(
      nextSnapshot.contents.find(
        (content) =>
          content.cardId === "card-parent",
      )?.contentJson,
    ).toBe(EMPTY_EDITOR_DOCUMENT_JSON);
  });

  it("unwraps an empty parent card and restores its children to the previous level", () => {
    const snapshot = wrapLevelInParent(makeDocumentSnapshot(), "card-a", "card-parent");

    const nextSnapshot = unwrapCard(snapshot, "card-parent");
    const rootChildren = nextSnapshot.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(nextSnapshot.cards.some((card) => card.id === "card-parent")).toBe(false);
    expect(rootChildren.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-a", 0],
      ["card-b", 1],
    ]);
  });
});
