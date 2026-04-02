import { useEffect, useRef } from "react";
import { serializeComparableDocumentSnapshot } from "../domain/document/serialization";
import {
  loadCurrentDocumentClock,
  loadCurrentDocumentSnapshot,
} from "./documentSnapshots";
import { useAppStore } from "../state/appStore";
import { useDocumentStore } from "../state/documentStore";
import type { DocumentSummary } from "../types/document";

const EXTERNAL_RELOAD_POLL_MS = 1200;

function serializeDocumentClock(summary: DocumentSummary | null) {
  if (
    !summary ||
    typeof summary.fileModifiedAtMs !== "number" ||
    typeof summary.updatedAtMs !== "number"
  ) {
    return null;
  }

  return `${summary.documentId}:${summary.updatedAtMs}:${summary.fileModifiedAtMs}`;
}

export function useExternalDocumentReload(document: DocumentSummary | null) {
  const dirty = useDocumentStore((state) => state.dirty);
  const commitExternalSnapshot = useDocumentStore(
    (state) => state.commitExternalSnapshot,
  );
  const saveState = useDocumentStore((state) => state.saveState);
  const snapshot = useDocumentStore((state) => state.snapshot);
  const setNotice = useAppStore((state) => state.setNotice);
  const inFlightRef = useRef(false);
  const lastSeenClockRef = useRef<string | null>(serializeDocumentClock(document));

  useEffect(() => {
    lastSeenClockRef.current = serializeDocumentClock(document);
  }, [document]);

  useEffect(() => {
    if (!snapshot || snapshot.summary.documentId !== document?.documentId) {
      return;
    }

    const summaryClock = serializeDocumentClock(snapshot.summary);

    if (summaryClock) {
      lastSeenClockRef.current = summaryClock;
    }
  }, [document?.documentId, snapshot]);

  useEffect(() => {
    if (!document) {
      return;
    }

    const activeDocument = document;
    let cancelled = false;
    let timeoutId: number | null = null;

    async function pollOnce() {
      if (
        cancelled ||
        inFlightRef.current ||
        dirty ||
        saveState === "saving" ||
        !snapshot ||
        snapshot.summary.documentId !== activeDocument.documentId
      ) {
        scheduleNextPoll();
        return;
      }

      inFlightRef.current = true;

      try {
        const latestClock = await loadCurrentDocumentClock();

        if (cancelled || latestClock.documentId !== activeDocument.documentId) {
          return;
        }

        const latestClockKey = `${latestClock.documentId}:${latestClock.updatedAtMs}:${latestClock.fileModifiedAtMs}`;

        if (!lastSeenClockRef.current) {
          lastSeenClockRef.current = latestClockKey;
          return;
        }

        if (lastSeenClockRef.current === latestClockKey) {
          return;
        }

        lastSeenClockRef.current = latestClockKey;
        const latestSnapshot = await loadCurrentDocumentSnapshot();

        if (
          cancelled ||
          latestSnapshot.summary.documentId !== activeDocument.documentId ||
          serializeComparableDocumentSnapshot(latestSnapshot) ===
            serializeComparableDocumentSnapshot(snapshot)
        ) {
          return;
        }

        commitExternalSnapshot(latestSnapshot);
        setNotice({
          message: "Document reloaded after an external update.",
          tone: "info",
        });
      } catch (error) {
        console.error(error);
      } finally {
        inFlightRef.current = false;
        scheduleNextPoll();
      }
    }

    function scheduleNextPoll() {
      if (cancelled) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void pollOnce();
      }, EXTERNAL_RELOAD_POLL_MS);
    }

    scheduleNextPoll();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    commitExternalSnapshot,
    dirty,
    document,
    saveState,
    setNotice,
    snapshot,
  ]);
}
