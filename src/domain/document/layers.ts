import { normalizeDocumentSnapshot } from "./serialization";
import type { DocumentSnapshot, LayerColor, LayerRecord } from "./types";

const MAX_LAYERS = 7;
const NON_BASE_LAYER_COLORS: LayerColor[] = [
  "red",
  "blue",
  "yellow",
  "green",
  "purple",
  "orange",
];

function colorForLayerIndex(layerIndex: number): LayerColor {
  if (layerIndex === 0) {
    return "neutral";
  }

  return NON_BASE_LAYER_COLORS[layerIndex - 1] ?? "orange";
}

export function createLayer(
  snapshot: DocumentSnapshot,
  layerId: string,
  name: string,
  description: string | null = null,
) {
  if (snapshot.layers.length >= MAX_LAYERS) {
    throw new Error("Fablecraft only supports up to seven layers.");
  }

  const layerIndex = snapshot.layers.length;
  const layer: LayerRecord = {
    color: colorForLayerIndex(layerIndex),
    description,
    documentId: snapshot.summary.documentId,
    id: layerId,
    isBase: false,
    layerIndex,
    name,
  };

  return normalizeDocumentSnapshot({
    ...snapshot,
    layers: snapshot.layers.concat(layer),
  });
}

export function renameLayer(
  snapshot: DocumentSnapshot,
  layerId: string,
  updates: Pick<LayerRecord, "description" | "name">,
) {
  return normalizeDocumentSnapshot({
    ...snapshot,
    layers: snapshot.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer,
    ),
  });
}

export function deleteLayer(snapshot: DocumentSnapshot, layerId: string) {
  const layer = snapshot.layers.find((candidate) => candidate.id === layerId);

  if (!layer) {
    throw new Error(`Unable to delete missing layer ${layerId}.`);
  }

  if (layer.isBase) {
    throw new Error("The base layer cannot be deleted.");
  }

  const remainingLayers = snapshot.layers
    .filter((candidate) => candidate.id !== layerId)
    .sort((left, right) => left.layerIndex - right.layerIndex || left.id.localeCompare(right.id))
    .map((candidate, index) => ({
      ...candidate,
      color: colorForLayerIndex(index),
      isBase: index === 0,
      layerIndex: index,
    }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    contents: snapshot.contents.filter((content) => content.layerId !== layerId),
    layers: remainingLayers,
  });
}

export function ensureLayerContent(
  snapshot: DocumentSnapshot,
  cardId: string,
  layerId: string,
  contentJson: string,
) {
  const hasContent = snapshot.contents.some(
    (content) => content.cardId === cardId && content.layerId === layerId,
  );

  if (hasContent) {
    return normalizeDocumentSnapshot(snapshot);
  }

  return normalizeDocumentSnapshot({
    ...snapshot,
    contents: snapshot.contents.concat({
      cardId,
      contentJson,
      layerId,
    }),
  });
}

