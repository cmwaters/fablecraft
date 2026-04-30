import type { DocumentSummary } from "../../types/document";

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
}

export interface RevisionRecord {
  createdAtMs: number;
  id: string;
  snapshot: string;
}

export interface DocumentSnapshot {
  cards: CardRecord[];
  contents: CardContentRecord[];
  revisions: RevisionRecord[];
  summary: DocumentSummary;
}

export interface EditableDocumentSnapshot {
  cards: CardRecord[];
  contents: CardContentRecord[];
  documentId: string;
}

export interface SaveDocumentResult {
  revisionId: string;
  savedAtMs: number;
}
