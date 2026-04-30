import { toEditableDocumentSnapshot } from "../domain/document/serialization";
import { useDocumentStore } from "../state/documentStore";
import { saveDocumentSnapshotAtPath } from "./documentSnapshots";

export async function forceSaveCurrentDocument() {
  const state = useDocumentStore.getState();

  if (!state.snapshot || !state.dirty) {
    return null;
  }

  const snapshot = state.snapshot;

  state.markSaving();

  try {
    const result = await saveDocumentSnapshotAtPath(
      snapshot.summary.path,
      toEditableDocumentSnapshot(snapshot),
    );
    useDocumentStore.getState().markSaved(result, snapshot.summary.documentId);

    return result;
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : error instanceof Error
          ? error.message
          : "Save failed unexpectedly.";

    useDocumentStore.getState().markSaveError(message);
    throw error;
  }
}
