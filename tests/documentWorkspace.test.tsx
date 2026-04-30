import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentWorkspace } from "../src/components/DocumentWorkspace";
import {
  contentJsonForPlainText,
  isContentEffectivelyEmpty,
  replaceCardContent,
} from "../src/domain/document/content";
import { useAppStore } from "../src/state/appStore";
import { useDocumentStore } from "../src/state/documentStore";
import { useInteractionStore } from "../src/state/interactionStore";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

const loadCurrentDocumentSnapshot = vi.fn();

vi.mock("../src/storage/documentSnapshots", () => ({
  loadCurrentDocumentSnapshot: () => loadCurrentDocumentSnapshot(),
}));

vi.mock("../src/storage/useDocumentAutosave", () => ({
  useDocumentAutosave: () => {},
}));

vi.mock("../src/storage/useExternalDocumentReload", () => ({
  useExternalDocumentReload: () => {},
}));

vi.mock("../src/components/CardEditor", () => ({
  CardEditor: ({
    focusPlacement,
    isEditing,
    onDeleteEmpty,
    onNavigateAbove,
    onNavigateChild,
    placeholder,
    pendingTextInput,
  }: {
    focusPlacement?: string | null;
    isEditing: boolean;
    onDeleteEmpty?: () => void;
    onNavigateAbove?: (placement?: "start" | "end") => boolean;
    onNavigateChild?: (placement?: "start" | "end") => boolean;
    placeholder?: string;
    pendingTextInput?: string | null;
  }) => (
    <div>
      <div
        data-editing={String(isEditing)}
        data-focus-placement={focusPlacement ?? ""}
        data-placeholder={placeholder ?? ""}
        data-pending-text-input={pendingTextInput ?? ""}
        data-testid="card-editor"
      />
      <button data-testid="card-editor-delete-empty" onClick={() => onDeleteEmpty?.()} type="button" />
      <button data-testid="card-editor-navigate-above" onClick={() => onNavigateAbove?.()} type="button" />
      <button data-testid="card-editor-navigate-child-end" onClick={() => onNavigateChild?.("end")} type="button" />
    </div>
  ),
}));

vi.mock("../src/components/TreeCardButton", () => ({
  TreeCardButton: ({
    cardLabel,
    placeholder,
  }: {
    cardLabel?: string;
    placeholder?: string;
  }) => (
    <div
      data-card-label={cardLabel ?? ""}
      data-placeholder={placeholder ?? ""}
      data-testid="tree-card"
    />
  ),
}));

class ResizeObserverMock {
  disconnect() {}

  observe() {}

  takeRecords() {
    return [];
  }

  unobserve() {}
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
    editingFuture: [],
    editingPast: [],
    errorMessage: null,
    lastSavedAtMs: null,
    navigationFuture: [],
    navigationPast: [],
    saveState: "idle",
    snapshot: null,
  });
  useInteractionStore.setState({
    activeCardId: null,
  });
}

describe("DocumentWorkspace", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    loadCurrentDocumentSnapshot.mockReset();
    resetStores();
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    globalThis.ResizeObserver = originalResizeObserver;
    document.body.innerHTML = "";
    resetStores();
  });

  it("keeps the active card shell footprint stable between navigation and editing", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-root",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    const navigationShell = container.querySelector(
      '[data-testid="active-card-shell"]',
    ) as HTMLDivElement | null;
    const navigationEditor = container.querySelector(
      '[data-testid="card-editor"]',
    ) as HTMLDivElement | null;

    expect(navigationShell).not.toBeNull();
    expect(navigationEditor?.dataset.editing).toBe("false");
    expect(container.querySelectorAll('[data-testid="tree-card"]')).toHaveLength(2);
    expect(navigationShell?.textContent).toContain("A01");

    const navigationStyle = {
      borderWidth: navigationShell?.style.borderWidth,
      minHeight: navigationShell?.style.minHeight,
      paddingBottom: navigationShell?.style.paddingBottom,
      paddingLeft: navigationShell?.style.paddingLeft,
      paddingRight: navigationShell?.style.paddingRight,
      paddingTop: navigationShell?.style.paddingTop,
    };

    await act(async () => {
      useAppStore.setState({ mode: "editing" });
    });

    const editingShell = container.querySelector(
      '[data-testid="active-card-shell"]',
    ) as HTMLDivElement | null;
    const editingEditor = container.querySelector(
      '[data-testid="card-editor"]',
    ) as HTMLDivElement | null;

    expect(editingShell).not.toBeNull();
    expect(editingEditor?.dataset.editing).toBe("true");
    expect(container.querySelectorAll('[data-testid="tree-card"]')).toHaveLength(2);
    expect({
      borderWidth: editingShell?.style.borderWidth,
      minHeight: editingShell?.style.minHeight,
      paddingBottom: editingShell?.style.paddingBottom,
      paddingLeft: editingShell?.style.paddingLeft,
      paddingRight: editingShell?.style.paddingRight,
      paddingTop: editingShell?.style.paddingTop,
    }).toEqual(navigationStyle);
    expect(editingShell?.style.paddingTop).toBe("40px");
    expect(Array.from(container.querySelectorAll('[data-testid="tree-card"]')).map((node) =>
      (node as HTMLDivElement).dataset.cardLabel,
    )).toEqual(["B01", "B02"]);

    await act(async () => {
      root.unmount();
    });
  });

  it("suspends workspace keyboard navigation while an overlay is open", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-a",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(
        <DocumentWorkspace
          document={snapshot.summary}
          suspendKeyboard
        />,
      );
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
        }),
      );
    });

    expect(useInteractionStore.getState().activeCardId).toBe("card-a");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Shift+Right to indent the active card under the sibling above", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-b",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
          shiftKey: true,
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    const rootChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const cardAChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-a")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(rootChildren?.map((card) => card.id)).toEqual(["card-a"]);
    expect(cardAChildren?.map((card) => card.id)).toEqual(["card-b"]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-b");

    await act(async () => {
      root.unmount();
    });
  });

  it("deletes an empty second root card on Backspace and keeps the first root placeholder semantics", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      cards: [
        {
          documentId: "doc-1",
          id: "card-root",
          orderIndex: 0,
          parentId: null,
          type: "card" as const,
        },
        {
          documentId: "doc-1",
          id: "card-root-2",
          orderIndex: 1,
          parentId: null,
          type: "card" as const,
        },
      ],
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Hello World"),
        },
        {
          cardId: "card-root-2",
          contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-root-2",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    const deleteButton = container.querySelector(
      '[data-testid="card-editor-delete-empty"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      deleteButton?.click();
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    expect(nextSnapshot?.cards.map((card) => card.id)).toEqual(["card-root"]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-root");

    await act(async () => {
      root.unmount();
    });
  });

  it("deletes an empty root-level card when Escape leaves editing", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      cards: [
        {
          documentId: "doc-1",
          id: "card-root",
          orderIndex: 0,
          parentId: null,
          type: "card" as const,
        },
        {
          documentId: "doc-1",
          id: "card-root-2",
          orderIndex: 1,
          parentId: null,
          type: "card" as const,
        },
      ],
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Hello World"),
        },
        {
          cardId: "card-root-2",
          contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-root-2",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;

    expect(nextSnapshot?.cards.map((card) => card.id)).toEqual(["card-root"]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-root");
    expect(useAppStore.getState().mode).toBe("navigation");

    await act(async () => {
      root.unmount();
    });
  });

  it("returns to the parent after Backspace deletes an empty child card", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Parent"),
        },
        {
          cardId: "card-a",
          contentJson: contentJsonForPlainText("Existing child"),
        },
        {
          cardId: "card-b",
          contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-b",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    const deleteButton = container.querySelector(
      '[data-testid="card-editor-delete-empty"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      deleteButton?.click();
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;

    expect(nextSnapshot?.cards.map((card) => card.id)).toEqual([
      "card-root",
      "card-a",
    ]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-root");
    expect(useAppStore.getState().mode).toBe("editing");

    await act(async () => {
      root.unmount();
    });
  });

  it("returns to the parent after Escape deletes an empty child card", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Parent"),
        },
        {
          cardId: "card-a",
          contentJson: contentJsonForPlainText("Existing child"),
        },
        {
          cardId: "card-b",
          contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-b",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;

    expect(nextSnapshot?.cards.map((card) => card.id)).toEqual([
      "card-root",
      "card-a",
    ]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-root");
    expect(useAppStore.getState().mode).toBe("navigation");

    await act(async () => {
      root.unmount();
    });
  });

  it("deletes an empty root-level card before ArrowUp moves editing to the previous root card", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      cards: [
        {
          documentId: "doc-1",
          id: "card-root",
          orderIndex: 0,
          parentId: null,
          type: "card" as const,
        },
        {
          documentId: "doc-1",
          id: "card-root-2",
          orderIndex: 1,
          parentId: null,
          type: "card" as const,
        },
      ],
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Hello World"),
        },
        {
          cardId: "card-root-2",
          contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-root-2",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    const navigateAboveButton = container.querySelector(
      '[data-testid="card-editor-navigate-above"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      navigateAboveButton?.click();
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;

    expect(nextSnapshot?.cards.map((card) => card.id)).toEqual(["card-root"]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-root");
    expect(useAppStore.getState().mode).toBe("editing");

    await act(async () => {
      root.unmount();
    });
  });

  it("keeps edit mode and places focus at the end after Tab+ArrowRight navigates to a child", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Root"),
        },
        {
          cardId: "card-a",
          contentJson: contentJsonForPlainText("Child"),
        },
        {
          cardId: "card-b",
          contentJson: contentJsonForPlainText("Sibling"),
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-root",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    const navigateChildEndButton = container.querySelector(
      '[data-testid="card-editor-navigate-child-end"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      navigateChildEndButton?.click();
    });

    const editor = container.querySelector(
      '[data-testid="card-editor"]',
    ) as HTMLElement | null;

    expect(useInteractionStore.getState().activeCardId).toBe("card-a");
    expect(useAppStore.getState().mode).toBe("editing");
    expect(editor?.dataset.focusPlacement).toBe("end");

    await act(async () => {
      root.unmount();
    });
  });

  it("keeps the final remaining card and empties it when deleting in navigation mode", async () => {
    const snapshot = {
      ...makeDocumentSnapshot(),
      cards: [
        {
          documentId: "doc-1",
          id: "card-root",
          orderIndex: 0,
          parentId: null,
          type: "card" as const,
        },
      ],
      contents: [
        {
          cardId: "card-root",
          contentJson: contentJsonForPlainText("Only card"),
        },
      ],
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-root",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Backspace",
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;

    expect(nextSnapshot?.cards.map((card) => card.id)).toEqual(["card-root"]);
    expect(
      isContentEffectivelyEmpty(nextSnapshot?.contents[0]?.contentJson ?? ""),
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Shift+Down to move a nested card into the next parent group in the same column", async () => {
    let snapshot = makeDocumentSnapshot();
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Act one"),
    });
    snapshot = replaceCardContent(snapshot, {
      cardId: "card-b",
      contentJson: contentJsonForPlainText("Act two"),
    });
    snapshot = {
      ...snapshot,
      cards: snapshot.cards.concat(
        {
          documentId: "doc-1",
          id: "card-a-1",
          orderIndex: 0,
          parentId: "card-a",
          type: "card",
        },
        {
          documentId: "doc-1",
          id: "card-b-1",
          orderIndex: 0,
          parentId: "card-b",
          type: "card",
        },
      ),
      contents: snapshot.contents.concat(
        {
          cardId: "card-a-1",
          contentJson: contentJsonForPlainText("Beat one"),
        },
        {
          cardId: "card-b-1",
          contentJson: contentJsonForPlainText("Beat two"),
        },
      ),
    };

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-a-1",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
          shiftKey: true,
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    const cardAChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-a")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const cardBChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-b")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(cardAChildren).toHaveLength(0);
    expect(cardBChildren?.map((card) => [card.id, card.orderIndex])).toEqual([
      ["card-b-1", 0],
      ["card-a-1", 1],
    ]);

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Option+Up to merge the sibling above into the active card", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-b",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          bubbles: true,
          key: "ArrowUp",
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    const rootChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(rootChildren?.map((card) => card.id)).toEqual(["card-b"]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-b");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Option+Down to merge the sibling below into the active card", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-a",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          bubbles: true,
          key: "ArrowDown",
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    const rootChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(rootChildren?.map((card) => card.id)).toEqual(["card-a"]);
    expect(useInteractionStore.getState().activeCardId).toBe("card-a");

    await act(async () => {
      root.unmount();
    });
  });

  it("starts editing and forwards the typed character when text is pressed in navigation mode", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-a",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "a",
        }),
      );
    });

    const editor = container.querySelector('[data-testid="card-editor"]');

    expect(useAppStore.getState().mode).toBe("editing");
    expect(editor?.getAttribute("data-pending-text-input")).toBe("a");
    expect(editor?.getAttribute("data-focus-placement")).toBe("end");

    await act(async () => {
      root.unmount();
    });
  });

  it("shows an italic empty-card placeholder only after leaving editing empty", async () => {
    const snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "editing",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-a",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    let editor = container.querySelector('[data-testid="card-editor"]');

    expect(editor?.getAttribute("data-placeholder")).toBe("");

    await act(async () => {
      useAppStore.setState({ mode: "navigation" });
    });

    editor = container.querySelector('[data-testid="card-editor"]');

    expect(editor?.getAttribute("data-placeholder")).toBe("empty card");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Cmd+ArrowDown to create a sibling below and focus it in edit mode", async () => {
    let snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    snapshot = replaceCardContent(snapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Scene"),
    });

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-a",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
          metaKey: true,
        }),
      );
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    const rootChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-root")
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const newCardId = useInteractionStore.getState().activeCardId;
    const editor = container.querySelector('[data-testid="card-editor"]');

    expect(rootChildren).toHaveLength(3);
    expect(rootChildren?.[1]?.id).toBe(newCardId);
    expect(useAppStore.getState().mode).toBe("editing");
    expect(editor?.getAttribute("data-focus-placement")).toBe("end");
    expect(editor?.getAttribute("data-placeholder")).toBe("");

    await act(async () => {
      root.unmount();
    });
  });

  it("renders an empty child gap for a selected card without children and uses it to create a child", async () => {
    let snapshot = makeDocumentSnapshot();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    snapshot = replaceCardContent(snapshot, {
      cardId: "card-b",
      contentJson: contentJsonForPlainText("Scene"),
    });
    snapshot = {
      ...snapshot,
      cards: snapshot.cards.concat({
        documentId: "doc-1",
        id: "card-a-1",
        orderIndex: 0,
        parentId: "card-a",
        type: "card",
      }),
      contents: snapshot.contents.concat({
        cardId: "card-a-1",
        contentJson: contentJsonForPlainText("Beat"),
      }),
    };

    useDocumentStore.getState().hydrateSnapshot(snapshot);
    useAppStore.setState({
      activeDocument: snapshot.summary,
      mode: "navigation",
      notice: null,
      screen: "workspace",
    });
    useInteractionStore.setState({
      activeCardId: "card-b",
    });
    loadCurrentDocumentSnapshot.mockResolvedValue(snapshot);

    await act(async () => {
      root.render(<DocumentWorkspace document={snapshot.summary} />);
    });

    const gap = container.querySelector(
      '[data-testid="empty-child-gap"]',
    ) as HTMLButtonElement | null;

    expect(gap).not.toBeNull();
    expect(gap?.style.minHeight).toBeTruthy();

    await act(async () => {
      gap?.click();
    });

    const nextSnapshot = useDocumentStore.getState().snapshot;
    const cardBChildren = nextSnapshot?.cards
      .filter((card) => card.parentId === "card-b")
      .sort((left, right) => left.orderIndex - right.orderIndex);

    expect(cardBChildren).toHaveLength(1);
    expect(useInteractionStore.getState().activeCardId).toBe(cardBChildren?.[0]?.id);
    expect(useAppStore.getState().mode).toBe("editing");

    await act(async () => {
      root.unmount();
    });
  });
});
