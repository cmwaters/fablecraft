import { EMPTY_EDITOR_DOCUMENT_JSON } from "../src/domain/document/editorDocument";
import type { DocumentSnapshot } from "../src/domain/document/types";

export function makeDocumentSnapshot(): DocumentSnapshot {
  return {
    cards: [
      {
        documentId: "doc-1",
        id: "card-root",
        orderIndex: 0,
        parentId: null,
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-a",
        orderIndex: 0,
        parentId: "card-root",
        type: "card",
      },
      {
        documentId: "doc-1",
        id: "card-b",
        orderIndex: 1,
        parentId: "card-root",
        type: "card",
      },
    ],
    contents: [
      {
        cardId: "card-root",
        contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
        layerId: "layer-base",
      },
      {
        cardId: "card-a",
        contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
        layerId: "layer-base",
      },
      {
        cardId: "card-b",
        contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
        layerId: "layer-base",
      },
    ],
    layers: [
      {
        color: "neutral",
        description: null,
        documentId: "doc-1",
        id: "layer-base",
        isBase: true,
        layerIndex: 0,
        name: "Base",
      },
    ],
    revisions: [],
    summary: {
      documentId: "doc-1",
      layerCount: 1,
      name: "Story",
      openedAtMs: 1,
      path: "/tmp/story.fable",
    },
  };
}

