import {
  normalizeDocumentSnapshot,
  serializeComparableDocumentSnapshot,
  serializeDocumentSnapshot,
  toEditableDocumentSnapshot,
} from "../src/domain/document/serialization";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document serialization", () => {
  it("stabilizes snapshot ordering before serialization", () => {
    const snapshot = makeDocumentSnapshot();
    const reorderedSnapshot = {
      ...snapshot,
      cards: [...snapshot.cards].reverse(),
      contents: [...snapshot.contents].reverse(),
      layers: [...snapshot.layers].reverse(),
    };

    expect(serializeDocumentSnapshot(snapshot)).toBe(
      serializeDocumentSnapshot(reorderedSnapshot),
    );
  });

  it("normalizes layers by layerIndex and falls back to id for tied indexes", () => {
    const snapshot = makeDocumentSnapshot();
    const misorderedSnapshot = {
      ...snapshot,
      layers: [
        {
          color: "red" as const,
          description: null,
          documentId: "doc-1",
          id: "layer-zeta",
          isBase: false,
          layerIndex: 1,
          name: "Zeta",
        },
        {
          color: "blue" as const,
          description: null,
          documentId: "doc-1",
          id: "layer-alpha",
          isBase: false,
          layerIndex: 1,
          name: "Alpha",
        },
        ...snapshot.layers,
      ],
    };

    const normalized = normalizeDocumentSnapshot(misorderedSnapshot);

    expect(normalized.layers.map((layer) => layer.id)).toEqual([
      "layer-base",
      "layer-alpha",
      "layer-zeta",
    ]);
  });

  it("groups cards by parent then order index when normalizing", () => {
    const snapshot = makeDocumentSnapshot();
    const shuffled = {
      ...snapshot,
      cards: [
        snapshot.cards[2]!,
        snapshot.cards[0]!,
        snapshot.cards[1]!,
      ],
    };

    const normalized = normalizeDocumentSnapshot(shuffled);

    expect(normalized.cards.map((card) => card.id)).toEqual([
      "card-root",
      "card-a",
      "card-b",
    ]);
  });

  it("produces comparable serialization that ignores openedAtMs drift", () => {
    const snapshot = makeDocumentSnapshot();
    const latestOpen = {
      ...snapshot,
      summary: { ...snapshot.summary, openedAtMs: 9_999 },
    };

    expect(serializeComparableDocumentSnapshot(snapshot)).toBe(
      serializeComparableDocumentSnapshot(latestOpen),
    );
  });

  it("strips non-editable fields when converting to an editable snapshot", () => {
    const snapshot = makeDocumentSnapshot();
    const editable = toEditableDocumentSnapshot(snapshot);

    expect(editable.documentId).toBe(snapshot.summary.documentId);
    expect(editable).not.toHaveProperty("summary");
    expect(editable).not.toHaveProperty("revisions");
  });

  it("handles empty arrays without throwing", () => {
    const emptySnapshot = {
      cards: [],
      contents: [],
      layers: [],
      revisions: [],
      summary: {
        documentId: "doc-empty",
        layerCount: 0,
        name: "Empty",
        openedAtMs: 0,
        path: "/tmp/empty.fable",
      },
    };

    expect(() => normalizeDocumentSnapshot(emptySnapshot)).not.toThrow();

    const serialized = serializeDocumentSnapshot(emptySnapshot);
    expect(JSON.parse(serialized).cards).toEqual([]);
  });
});
