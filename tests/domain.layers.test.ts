import { createLayer, deleteLayer, renameLayer } from "../src/domain/document/layers";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document layer operations", () => {
  it("creates layers with deterministic colors", () => {
    let snapshot = makeDocumentSnapshot();

    snapshot = createLayer(snapshot, "layer-red", "Plot");
    snapshot = createLayer(snapshot, "layer-blue", "Theme");

    expect(snapshot.layers.map((layer) => [layer.name, layer.color])).toEqual([
      ["Base", "neutral"],
      ["Plot", "red"],
      ["Theme", "blue"],
    ]);
  });

  it("renames a layer without changing its place", () => {
    const snapshot = createLayer(makeDocumentSnapshot(), "layer-red", "Plot");

    const nextSnapshot = renameLayer(snapshot, "layer-red", {
      description: "Character motivations",
      name: "Character",
    });

    expect(nextSnapshot.layers[1]).toMatchObject({
      description: "Character motivations",
      layerIndex: 1,
      name: "Character",
    });
  });

  it("does not allow deleting the base layer", () => {
    expect(() => deleteLayer(makeDocumentSnapshot(), "layer-base")).toThrow(
      /base layer/i,
    );
  });

  it("reindexes remaining layers after deletion", () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = createLayer(snapshot, "layer-red", "Plot");
    snapshot = createLayer(snapshot, "layer-blue", "Theme");

    const nextSnapshot = deleteLayer(snapshot, "layer-red");

    expect(nextSnapshot.layers.map((layer) => [layer.name, layer.layerIndex, layer.color])).toEqual([
      ["Base", 0, "neutral"],
      ["Theme", 1, "red"],
    ]);
  });
});

