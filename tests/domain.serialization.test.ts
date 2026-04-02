import { serializeDocumentSnapshot } from "../src/domain/document/serialization";
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
});
