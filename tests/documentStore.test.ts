import { markdownToContentJson } from "../src/domain/document/importExport";
import { replaceCardContent } from "../src/domain/document/content";
import { useDocumentStore } from "../src/state/documentStore";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document store", () => {
  beforeEach(() => {
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
  });

  it("records external MCP mutations as a single undo step", () => {
    const initialSnapshot = makeDocumentSnapshot();
    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);

    const nextSnapshot = {
      ...replaceCardContent(initialSnapshot, {
        cardId: "card-a",
        contentJson: markdownToContentJson("Updated beat"),
      }),
      revisions: [
        {
          createdAtMs: 42,
          id: "revision-1",
          snapshot: "serialized-snapshot",
        },
      ],
    };

    useDocumentStore.getState().commitExternalSnapshot(nextSnapshot);

    expect(useDocumentStore.getState().dirty).toBe(false);
    expect(useDocumentStore.getState().navigationPast).toHaveLength(1);
    expect(
      useDocumentStore
        .getState()
        .snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).toContain("Updated beat");

    useDocumentStore.getState().undoNavigation();

    expect(useDocumentStore.getState().dirty).toBe(true);
    expect(
      useDocumentStore
        .getState()
        .snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).not.toContain("Updated beat");
  });

  it("redos navigation history after an undo", () => {
    const initialSnapshot = makeDocumentSnapshot();
    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);

    const nextSnapshot = replaceCardContent(initialSnapshot, {
      cardId: "card-a",
      contentJson: markdownToContentJson("Updated beat"),
    });

    useDocumentStore.getState().applyNavigationChange(() => nextSnapshot);
    useDocumentStore.getState().undoNavigation();
    useDocumentStore.getState().redoNavigation();

    expect(
      useDocumentStore
        .getState()
        .snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).toContain("Updated beat");
  });

  it("ignores stale save completions from a different document", () => {
    useDocumentStore.getState().hydrateSnapshot(makeDocumentSnapshot());
    useDocumentStore.getState().applyNavigationChange((snapshot) =>
      replaceCardContent(snapshot, {
        cardId: "card-a",
        contentJson: markdownToContentJson("Unsaved change"),
      }),
    );

    const nextDocument = {
      ...makeDocumentSnapshot(),
      cards: makeDocumentSnapshot().cards.map((card) => ({
        ...card,
        documentId: "doc-2",
      })),
      summary: {
        documentId: "doc-2",
        name: "Other",
        openedAtMs: 2,
        path: "/tmp/other.fable",
      },
    };

    useDocumentStore.getState().hydrateSnapshot(nextDocument);
    useDocumentStore.getState().markSaved(
      {
        revisionId: "rev-old-doc",
        savedAtMs: 99,
      },
      "doc-1",
    );

    const state = useDocumentStore.getState();

    expect(state.snapshot?.summary.documentId).toBe("doc-2");
    expect(state.lastSavedAtMs).toBeNull();
    expect(state.snapshot?.revisions).toHaveLength(0);
  });

  it("clears dirty local edits when an external snapshot arrives mid-edit", () => {
    const initialSnapshot = makeDocumentSnapshot();
    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);

    useDocumentStore.getState().updateSnapshot((snapshot) =>
      replaceCardContent(snapshot, {
        cardId: "card-a",
        contentJson: markdownToContentJson("Local unsaved change"),
      }),
    );

    expect(useDocumentStore.getState().dirty).toBe(true);
    expect(useDocumentStore.getState().saveState).toBe("idle");

    const externalSnapshot = replaceCardContent(initialSnapshot, {
      cardId: "card-b",
      contentJson: markdownToContentJson("Remote update to card-b"),
    });

    useDocumentStore.getState().commitExternalSnapshot(externalSnapshot);

    const state = useDocumentStore.getState();

    expect(state.dirty).toBe(false);
    expect(state.saveState).toBe("saved");
    expect(
      state.snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).not.toContain("Local unsaved change");
    expect(
      state.snapshot?.contents.find((content) => content.cardId === "card-b")?.contentJson,
    ).toContain("Remote update to card-b");

    useDocumentStore.getState().undoNavigation();

    expect(
      useDocumentStore
        .getState()
        .snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).toContain("Local unsaved change");
  });

  it("undos and redos editing history through snapshot updates", () => {
    const initialSnapshot = makeDocumentSnapshot();
    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);

    useDocumentStore.getState().updateSnapshot((snapshot) =>
      replaceCardContent(snapshot, {
        cardId: "card-a",
        contentJson: markdownToContentJson("Draft change"),
      }),
    );

    expect(
      useDocumentStore.getState().snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).toContain("Draft change");

    useDocumentStore.getState().undoEditing();

    expect(
      useDocumentStore.getState().snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).not.toContain("Draft change");

    useDocumentStore.getState().redoEditing();

    expect(
      useDocumentStore.getState().snapshot?.contents.find((content) => content.cardId === "card-a")?.contentJson,
    ).toContain("Draft change");
  });
});
