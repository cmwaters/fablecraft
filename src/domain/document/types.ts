import type { DocumentSummary } from "../../types/document";

export const LAYER_COLOR_SEQUENCE = [
  "neutral",
  "red",
  "blue",
  "yellow",
  "green",
  "purple",
  "orange",
] as const;

export type LayerColor = (typeof LAYER_COLOR_SEQUENCE)[number];

export interface LayerRecord {
  color: LayerColor;
  description: string | null;
  documentId: string;
  id: string;
  isBase: boolean;
  layerIndex: number;
  name: string;
}

export interface CardRecord {
  documentId: string;
  id: string;
  orderIndex: number;
  parentId: string | null;
  type: "card";
}

export interface CardContentRecord {
  cardId: string;
  contentJson: string;
  layerId: string;
}

export interface RevisionRecord {
  createdAtMs: number;
  id: string;
  snapshot: string;
}

export interface DocumentSnapshot {
  cards: CardRecord[];
  contents: CardContentRecord[];
  layers: LayerRecord[];
  revisions: RevisionRecord[];
  summary: DocumentSummary;
}

export interface EditableDocumentSnapshot {
  cards: CardRecord[];
  contents: CardContentRecord[];
  documentId: string;
  layers: LayerRecord[];
}

export interface SaveDocumentResult {
  revisionId: string;
  savedAtMs: number;
}

