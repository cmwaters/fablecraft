import { buildCardNumberMap } from "../src/domain/document/cardNumbers";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("card numbering", () => {
  it("assigns stable human-friendly labels by depth and visual order", () => {
    const snapshot = makeDocumentSnapshot();
    snapshot.cards.push(
      {
        documentId: "doc-1",
        id: "card-a-child",
        orderIndex: 0,
        parentId: "card-a",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-b-child",
        orderIndex: 0,
        parentId: "card-b",
        type: "card",
      },
    );

    expect(buildCardNumberMap(snapshot)).toEqual({
      "card-a": "B01",
      "card-a-child": "C01",
      "card-b": "B02",
      "card-b-child": "C02",
      "card-root": "A01",
    });
  });
});
