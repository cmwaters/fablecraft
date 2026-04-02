import { create } from "zustand";
import {
  createDocumentHistoryState,
  recordDocumentHistory,
  redoDocumentHistory,
  undoDocumentHistory,
} from "../domain/document/history";
import {
  normalizeDocumentSnapshot,
  serializeComparableDocumentSnapshot,
  serializeDocumentSnapshot,
} from "../domain/document/serialization";
import type { DocumentSnapshot, SaveDocumentResult } from "../domain/document/types";

type SaveState = "idle" | "saving" | "saved" | "error";

interface DocumentState {
  applyNavigationChange: (
    updater: (snapshot: DocumentSnapshot) => DocumentSnapshot,
  ) => void;
  editingFuture: DocumentSnapshot[];
  editingPast: DocumentSnapshot[];
  commitExternalSnapshot: (snapshot: DocumentSnapshot) => void;
  dirty: boolean;
  errorMessage: string | null;
  hydrateSnapshot: (snapshot: DocumentSnapshot) => void;
  lastSavedAtMs: number | null;
  markSaveError: (message: string) => void;
  markSaved: (result: SaveDocumentResult) => void;
  markSaving: () => void;
  navigationFuture: DocumentSnapshot[];
  navigationPast: DocumentSnapshot[];
  redoEditing: () => void;
  redoNavigation: () => void;
  saveState: SaveState;
  snapshot: DocumentSnapshot | null;
  updateSnapshot: (
    updater: (snapshot: DocumentSnapshot) => DocumentSnapshot,
  ) => void;
  undoEditing: () => void;
  undoNavigation: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  applyNavigationChange: (updater) =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      const history = recordDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: state.snapshot,
        },
        "navigation",
        updater(state.snapshot),
      );

      return {
        dirty: true,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        errorMessage: null,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        saveState: "idle",
        snapshot: history.present,
      };
    }),
  commitExternalSnapshot: (snapshot) =>
    set((state) => {
      const nextSnapshot = normalizeDocumentSnapshot(snapshot);

      if (!state.snapshot) {
        return {
          dirty: false,
          editingFuture: [],
          editingPast: [],
          errorMessage: null,
          lastSavedAtMs: nextSnapshot.revisions[0]?.createdAtMs ?? null,
          navigationFuture: [],
          navigationPast: [],
          saveState: "saved" as const,
          snapshot: nextSnapshot,
        };
      }

      const currentSnapshot = normalizeDocumentSnapshot(state.snapshot);
      const hasChanged =
        serializeComparableDocumentSnapshot(currentSnapshot) !==
        serializeComparableDocumentSnapshot(nextSnapshot);

      if (!hasChanged) {
        return {
          dirty: false,
          errorMessage: null,
          lastSavedAtMs:
            nextSnapshot.revisions[0]?.createdAtMs ?? state.lastSavedAtMs,
          saveState: "saved" as const,
          snapshot: nextSnapshot,
        };
      }

      const history = recordDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: currentSnapshot,
        },
        "navigation",
        nextSnapshot,
      );

      return {
        dirty: false,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        errorMessage: null,
        lastSavedAtMs:
          nextSnapshot.revisions[0]?.createdAtMs ?? state.lastSavedAtMs,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        saveState: "saved" as const,
        snapshot: history.present,
      };
    }),
  dirty: false,
  editingFuture: [],
  editingPast: [],
  errorMessage: null,
  hydrateSnapshot: (snapshot) =>
    set({
      dirty: false,
      editingFuture: [],
      editingPast: [],
      errorMessage: null,
      lastSavedAtMs: snapshot.revisions[0]?.createdAtMs ?? null,
      navigationFuture: [],
      navigationPast: [],
      saveState: "idle",
      snapshot: normalizeDocumentSnapshot(snapshot),
    }),
  lastSavedAtMs: null,
  markSaveError: (message) =>
    set({
      errorMessage: message,
      saveState: "error",
    }),
  markSaved: (result) =>
    set((state) => ({
      dirty: false,
      errorMessage: null,
      lastSavedAtMs: result.savedAtMs,
      saveState: "saved",
      snapshot: state.snapshot
        ? {
            ...state.snapshot,
            revisions: [
              {
                createdAtMs: result.savedAtMs,
                id: result.revisionId,
                snapshot: serializeDocumentSnapshot(state.snapshot),
              },
              ...state.snapshot.revisions.filter(
                (revision) => revision.id !== result.revisionId,
              ),
            ].slice(0, 20),
            summary: {
              ...state.snapshot.summary,
              fileModifiedAtMs: result.savedAtMs,
              updatedAtMs: result.savedAtMs,
            },
          }
        : null,
    })),
  markSaving: () =>
    set({
      saveState: "saving",
    }),
  navigationFuture: [],
  navigationPast: [],
  redoEditing: () =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      const history = redoDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: state.snapshot,
        },
        "editing",
      );

      return {
        dirty: true,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        snapshot: history.present,
      };
    }),
  redoNavigation: () =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      const history = redoDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: state.snapshot,
        },
        "navigation",
      );

      return {
        dirty: true,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        snapshot: history.present,
      };
    }),
  saveState: "idle",
  snapshot: null,
  undoEditing: () =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      const history = undoDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: state.snapshot,
        },
        "editing",
      );

      return {
        dirty: true,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        snapshot: history.present,
      };
    }),
  undoNavigation: () =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      const history = undoDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: state.snapshot,
        },
        "navigation",
      );

      return {
        dirty: true,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        snapshot: history.present,
      };
    }),
  updateSnapshot: (updater) =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      const currentSnapshot = normalizeDocumentSnapshot(state.snapshot);
      const nextSnapshot = normalizeDocumentSnapshot(updater(currentSnapshot));
      const hasChanged =
        serializeComparableDocumentSnapshot(currentSnapshot) !==
        serializeComparableDocumentSnapshot(nextSnapshot);

      if (!hasChanged) {
        return {
          dirty: state.dirty,
          errorMessage: null,
          saveState: state.saveState,
          snapshot: nextSnapshot,
        };
      }

      const history = recordDocumentHistory(
        {
          future: { editing: state.editingFuture, navigation: state.navigationFuture },
          past: { editing: state.editingPast, navigation: state.navigationPast },
          present: currentSnapshot,
        },
        "editing",
        nextSnapshot,
      );

      return {
        dirty: true,
        editingFuture: history.future.editing,
        editingPast: history.past.editing,
        errorMessage: null,
        navigationFuture: history.future.navigation,
        navigationPast: history.past.navigation,
        saveState: "idle",
        snapshot: history.present,
      };
    }),
}));
