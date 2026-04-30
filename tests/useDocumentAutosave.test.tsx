import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";
import {
  contentJsonForPlainText,
  replaceCardContent,
} from "../src/domain/document/content";
import { useDocumentAutosave } from "../src/storage/useDocumentAutosave";
import { useDocumentStore } from "../src/state/documentStore";

const saveDocumentSnapshotAtPath = vi.fn();

vi.mock("../src/storage/documentSnapshots", () => ({
  saveDocumentSnapshotAtPath: (...args: unknown[]) =>
    saveDocumentSnapshotAtPath(...args),
}));

function TestHarness() {
  useDocumentAutosave();
  return null;
}

function resetDocumentStore() {
  useDocumentStore.setState({
    dirty: false,
    editingFuture: [],
    editingPast: [],
    errorMessage: null,
    lastSavedAtMs: null,
    navigationFuture: [],
    navigationPast: [],
    saveState: "idle",
    snapshot: null,
  });
}

describe("useDocumentAutosave", () => {
  const originalActEnvironment = (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    saveDocumentSnapshotAtPath.mockReset();
    resetDocumentStore();
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.useRealTimers();
    document.body.innerHTML = "";
    resetDocumentStore();
  });

  it("marks the document saved after a successful autosave cycle", async () => {
    saveDocumentSnapshotAtPath.mockResolvedValue({
      revisionId: "rev-success",
      savedAtMs: 1_700,
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(makeDocumentSnapshot());
    useDocumentStore.setState({ dirty: true });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(saveDocumentSnapshotAtPath).toHaveBeenCalledTimes(1);
    expect(saveDocumentSnapshotAtPath).toHaveBeenCalledWith(
      "/tmp/story.fable",
      expect.objectContaining({ documentId: "doc-1" }),
    );
    expect(useDocumentStore.getState().saveState).toBe("saved");
    expect(useDocumentStore.getState().dirty).toBe(false);
    expect(useDocumentStore.getState().errorMessage).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("surfaces the save failure to the store and recovers on the next successful save", async () => {
    saveDocumentSnapshotAtPath.mockRejectedValueOnce(new Error("offline"));
    saveDocumentSnapshotAtPath.mockResolvedValue({
      revisionId: "rev-recover",
      savedAtMs: 2_100,
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(makeDocumentSnapshot());
    useDocumentStore.setState({ dirty: true });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(useDocumentStore.getState().saveState).toBe("error");
    expect(useDocumentStore.getState().errorMessage).toBe("offline");
    expect(useDocumentStore.getState().dirty).toBe(true);

    await act(async () => {
      useDocumentStore.getState().updateSnapshot((snapshot) =>
        replaceCardContent(snapshot, {
          cardId: "card-a",
          contentJson: contentJsonForPlainText("Second attempt"),
        }),
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(saveDocumentSnapshotAtPath).toHaveBeenCalledTimes(2);
    expect(useDocumentStore.getState().saveState).toBe("saved");
    expect(useDocumentStore.getState().errorMessage).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("falls back to a generic message when the thrown value is not an Error", async () => {
    saveDocumentSnapshotAtPath.mockRejectedValue("string-rejection");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(makeDocumentSnapshot());
    useDocumentStore.setState({ dirty: true });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(useDocumentStore.getState().saveState).toBe("error");
    expect(useDocumentStore.getState().errorMessage).toBe(
      "Autosave failed unexpectedly.",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("does not run when the snapshot is clean", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(makeDocumentSnapshot());

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(saveDocumentSnapshotAtPath).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
