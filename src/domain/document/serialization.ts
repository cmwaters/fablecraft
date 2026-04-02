import type { CardContentRecord, CardRecord, DocumentSnapshot, EditableDocumentSnapshot, LayerRecord, RevisionRecord } from "./types";

function compareNullableStrings(left: string | null, right: string | null) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return -1;
  }

  if (right === null) {
    return 1;
  }

  return left.localeCompare(right);
}

function normalizeLayers(layers: LayerRecord[]) {
  return [...layers].sort((left, right) => left.layerIndex - right.layerIndex || left.id.localeCompare(right.id));
}

function normalizeCards(cards: CardRecord[]) {
  return [...cards].sort((left, right) => {
    const parentComparison = compareNullableStrings(left.parentId, right.parentId);

    if (parentComparison !== 0) {
      return parentComparison;
    }

    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    return left.id.localeCompare(right.id);
  });
}

function normalizeContents(contents: CardContentRecord[]) {
  return [...contents].sort((left, right) => {
    if (left.layerId !== right.layerId) {
      return left.layerId.localeCompare(right.layerId);
    }

    return left.cardId.localeCompare(right.cardId);
  });
}

function normalizeRevisions(revisions: RevisionRecord[]) {
  return [...revisions].sort((left, right) => left.createdAtMs - right.createdAtMs || left.id.localeCompare(right.id));
}

export function normalizeEditableDocumentSnapshot(
  snapshot: EditableDocumentSnapshot,
): EditableDocumentSnapshot {
  return {
    cards: normalizeCards(snapshot.cards),
    contents: normalizeContents(snapshot.contents),
    documentId: snapshot.documentId,
    layers: normalizeLayers(snapshot.layers),
  };
}

export function normalizeDocumentSnapshot(snapshot: DocumentSnapshot): DocumentSnapshot {
  return {
    cards: normalizeCards(snapshot.cards),
    contents: normalizeContents(snapshot.contents),
    layers: normalizeLayers(snapshot.layers),
    revisions: normalizeRevisions(snapshot.revisions),
    summary: snapshot.summary,
  };
}

function comparableDocumentSummary(snapshot: DocumentSnapshot) {
  return {
    documentId: snapshot.summary.documentId,
    name: snapshot.summary.name,
    openedAtMs: 0,
    path: snapshot.summary.path,
  };
}

export function toEditableDocumentSnapshot(
  snapshot: DocumentSnapshot,
): EditableDocumentSnapshot {
  return normalizeEditableDocumentSnapshot({
    cards: snapshot.cards,
    contents: snapshot.contents,
    documentId: snapshot.summary.documentId,
    layers: snapshot.layers,
  });
}

export function serializeEditableDocumentSnapshot(
  snapshot: EditableDocumentSnapshot,
) {
  return JSON.stringify(normalizeEditableDocumentSnapshot(snapshot));
}

export function serializeDocumentSnapshot(snapshot: DocumentSnapshot) {
  return JSON.stringify(normalizeDocumentSnapshot(snapshot));
}

export function serializeComparableDocumentSnapshot(snapshot: DocumentSnapshot) {
  const normalizedSnapshot = normalizeDocumentSnapshot(snapshot);

  return JSON.stringify({
    cards: normalizedSnapshot.cards,
    contents: normalizedSnapshot.contents,
    layers: normalizedSnapshot.layers,
    summary: comparableDocumentSummary(normalizedSnapshot),
  });
}
