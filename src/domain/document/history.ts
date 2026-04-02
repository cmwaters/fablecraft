import {
  normalizeDocumentSnapshot,
  serializeComparableDocumentSnapshot,
} from "./serialization";
import type { DocumentSnapshot } from "./types";

export type HistoryMode = "editing" | "navigation";

export interface DocumentHistoryState {
  future: Record<HistoryMode, DocumentSnapshot[]>;
  past: Record<HistoryMode, DocumentSnapshot[]>;
  present: DocumentSnapshot;
}

export function createDocumentHistoryState(
  snapshot: DocumentSnapshot,
): DocumentHistoryState {
  const normalizedSnapshot = normalizeDocumentSnapshot(snapshot);

  return {
    future: {
      editing: [],
      navigation: [],
    },
    past: {
      editing: [],
      navigation: [],
    },
    present: normalizedSnapshot,
  };
}

export function recordDocumentHistory(
  history: DocumentHistoryState,
  mode: HistoryMode,
  nextSnapshot: DocumentSnapshot,
) {
  const normalizedCurrent = normalizeDocumentSnapshot(history.present);
  const normalizedNext = normalizeDocumentSnapshot(nextSnapshot);

  if (
    serializeComparableDocumentSnapshot(normalizedCurrent) ===
    serializeComparableDocumentSnapshot(normalizedNext)
  ) {
    return history;
  }

  return {
    future: {
      ...history.future,
      [mode]: [],
    },
    past: {
      ...history.past,
      [mode]: history.past[mode].concat(normalizedCurrent),
    },
    present: normalizedNext,
  };
}

export function undoDocumentHistory(
  history: DocumentHistoryState,
  mode: HistoryMode,
) {
  const previousSnapshot = history.past[mode][history.past[mode].length - 1];

  if (!previousSnapshot) {
    return history;
  }

  return {
    future: {
      ...history.future,
      [mode]: [history.present].concat(history.future[mode]),
    },
    past: {
      ...history.past,
      [mode]: history.past[mode].slice(0, -1),
    },
    present: previousSnapshot,
  };
}

export function redoDocumentHistory(
  history: DocumentHistoryState,
  mode: HistoryMode,
) {
  const nextSnapshot = history.future[mode][0];

  if (!nextSnapshot) {
    return history;
  }

  return {
    future: {
      ...history.future,
      [mode]: history.future[mode].slice(1),
    },
    past: {
      ...history.past,
      [mode]: history.past[mode].concat(history.present),
    },
    present: nextSnapshot,
  };
}
