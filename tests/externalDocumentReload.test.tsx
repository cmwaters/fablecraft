import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";
import { useExternalDocumentReload } from "../src/storage/useExternalDocumentReload";
import { useAppStore } from "../src/state/appStore";
import { useDocumentStore } from "../src/state/documentStore";

const loadCurrentDocumentClock = vi.fn();
const loadCurrentDocumentSnapshot = vi.fn();

vi.mock("../src/storage/documentSnapshots", () => ({
  loadCurrentDocumentClock: () => loadCurrentDocumentClock(),
  loadCurrentDocumentSnapshot: () => loadCurrentDocumentSnapshot(),
}));

function TestHarness() {
  const snapshot = useDocumentStore((state) => state.snapshot);

  useExternalDocumentReload(snapshot?.summary ?? null);

  return null;
}

function resetStores() {
  useAppStore.setState({
    activeDocument: null,
    mode: "navigation",
    notice: null,
    screen: "workspace",
  });
  useDocumentStore.setState({
    dirty: false,
    errorMessage: null,
    lastSavedAtMs: null,
    navigationFuture: [],
    navigationPast: [],
    saveState: "idle",
    snapshot: null,
  });
}

function withDocumentClock(
  snapshot = makeDocumentSnapshot(),
  fileModifiedAtMs = 10,
  updatedAtMs = 10,
) {
  return {
    ...snapshot,
    summary: {
      ...snapshot.summary,
      fileModifiedAtMs,
      updatedAtMs,
    },
  };
}

describe("useExternalDocumentReload", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    loadCurrentDocumentClock.mockReset();
    loadCurrentDocumentSnapshot.mockReset();
    resetStores();
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.useRealTimers();
    document.body.innerHTML = "";
    resetStores();
  });

  it("reloads the open snapshot after an external file update", async () => {
    const initialSnapshot = withDocumentClock();
    const externalSnapshot = {
      ...withDocumentClock(makeDocumentSnapshot(), 20, 20),
      contents: [
        ...makeDocumentSnapshot().contents.filter(
          (content) => content.cardId !== "card-root",
        ),
        {
          cardId: "card-root",
          contentJson: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"External update\"}]}]}",
          layerId: "layer-base",
        },
      ],
      revisions: [
        {
          createdAtMs: 10,
          id: "rev-external",
          snapshot: "external",
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useAppStore.setState({
      activeDocument: initialSnapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockResolvedValue({
      documentId: initialSnapshot.summary.documentId,
      fileModifiedAtMs: 20,
      updatedAtMs: 20,
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(externalSnapshot);

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(1);
    expect(loadCurrentDocumentSnapshot).toHaveBeenCalledTimes(1);
    expect(useDocumentStore.getState().snapshot?.revisions[0]?.id).toBe("rev-external");
    expect(useAppStore.getState().notice?.message).toBe(
      "Document reloaded after an external update.",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("does not reload while the current document has unsaved local changes", async () => {
    const initialSnapshot = withDocumentClock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useDocumentStore.setState({ dirty: true });
    useAppStore.setState({
      activeDocument: initialSnapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockResolvedValue({
      documentId: initialSnapshot.summary.documentId,
      fileModifiedAtMs: 20,
      updatedAtMs: 20,
    });
    loadCurrentDocumentSnapshot.mockResolvedValue({
      ...makeDocumentSnapshot(),
      revisions: [
        {
          createdAtMs: 11,
          id: "rev-skipped",
          snapshot: "external",
        },
      ],
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).not.toHaveBeenCalled();
    expect(loadCurrentDocumentSnapshot).not.toHaveBeenCalled();
    expect(useDocumentStore.getState().snapshot?.revisions).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
  });

  it("ignores reloads that only change openedAtMs", async () => {
    const initialSnapshot = withDocumentClock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useAppStore.setState({
      activeDocument: initialSnapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockResolvedValue({
      documentId: initialSnapshot.summary.documentId,
      fileModifiedAtMs: 20,
      updatedAtMs: 20,
    });
    loadCurrentDocumentSnapshot.mockResolvedValue({
      ...withDocumentClock(makeDocumentSnapshot(), 20, 20),
      summary: {
        ...withDocumentClock().summary,
        openedAtMs: 99,
      },
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(1);
    expect(loadCurrentDocumentSnapshot).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().notice).toBeNull();
    expect(useDocumentStore.getState().snapshot?.summary.openedAtMs).toBe(1);

    await act(async () => {
      root.unmount();
    });
  });

  it("ignores reloads that only change document clock metadata", async () => {
    const initialSnapshot = withDocumentClock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useAppStore.setState({
      activeDocument: initialSnapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockResolvedValue({
      documentId: initialSnapshot.summary.documentId,
      fileModifiedAtMs: 40,
      updatedAtMs: 40,
    });
    loadCurrentDocumentSnapshot.mockResolvedValue({
      ...withDocumentClock(makeDocumentSnapshot(), 40, 40),
      summary: {
        ...withDocumentClock().summary,
        fileModifiedAtMs: 40,
        updatedAtMs: 40,
      },
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(1);
    expect(loadCurrentDocumentSnapshot).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().notice).toBeNull();
    expect(useDocumentStore.getState().snapshot?.summary.fileModifiedAtMs).toBe(10);
    expect(useDocumentStore.getState().snapshot?.summary.updatedAtMs).toBe(10);

    await act(async () => {
      root.unmount();
    });
  });

  it("ignores reloads that only add a revision without changing the tree content", async () => {
    const initialSnapshot = withDocumentClock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useAppStore.setState({
      activeDocument: initialSnapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockResolvedValue({
      documentId: initialSnapshot.summary.documentId,
      fileModifiedAtMs: 50,
      updatedAtMs: 50,
    });
    loadCurrentDocumentSnapshot.mockResolvedValue({
      ...withDocumentClock(makeDocumentSnapshot(), 50, 50),
      revisions: [
        {
          createdAtMs: 50,
          id: "rev-local-save",
          snapshot: "{\"same\":\"content\"}",
        },
      ],
      summary: {
        ...withDocumentClock().summary,
        fileModifiedAtMs: 50,
        updatedAtMs: 50,
      },
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(1);
    expect(loadCurrentDocumentSnapshot).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().notice).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("swallows clock lookup failures without touching the store or notice", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const initialSnapshot = withDocumentClock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useAppStore.setState({
      activeDocument: initialSnapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockRejectedValue({
      code: "document_missing",
      message: "Document file was deleted while the editor was open.",
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(1);
    expect(loadCurrentDocumentSnapshot).not.toHaveBeenCalled();
    expect(useAppStore.getState().notice).toBeNull();
    expect(useDocumentStore.getState().snapshot?.summary.documentId).toBe(
      initialSnapshot.summary.documentId,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });

    consoleError.mockRestore();
  });

  it("skips the full snapshot reload when the document clock is unchanged", async () => {
    const initialSnapshot = withDocumentClock(makeDocumentSnapshot(), 20, 20);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);
    useAppStore.setState({
      activeDocument: {
        ...initialSnapshot.summary,
        fileModifiedAtMs: 20,
        updatedAtMs: 20,
      },
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    loadCurrentDocumentClock.mockResolvedValue({
      documentId: initialSnapshot.summary.documentId,
      fileModifiedAtMs: 20,
      updatedAtMs: 20,
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(loadCurrentDocumentClock).toHaveBeenCalledTimes(1);
    expect(loadCurrentDocumentSnapshot).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
