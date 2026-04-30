import { useEffect } from "react";
import { toEditableDocumentSnapshot } from "../domain/document/serialization";
import { saveDocumentSnapshotAtPath } from "./documentSnapshots";
import { useDocumentStore } from "../state/documentStore";

export function useDocumentAutosave() {
  const dirty = useDocumentStore((state) => state.dirty);
  const snapshot = useDocumentStore((state) => state.snapshot);
  const markSaveError = useDocumentStore((state) => state.markSaveError);
  const markSaved = useDocumentStore((state) => state.markSaved);
  const markSaving = useDocumentStore((state) => state.markSaving);

  useEffect(() => {
    if (!snapshot || !dirty) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        markSaving();
        const result = await saveDocumentSnapshotAtPath(
          snapshot.summary.path,
          toEditableDocumentSnapshot(snapshot),
        );
        markSaved(result, snapshot.summary.documentId);
      } catch (error) {
        markSaveError(
          error instanceof Error ? error.message : "Autosave failed unexpectedly.",
        );
      }
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dirty, markSaveError, markSaved, markSaving, snapshot]);
}
