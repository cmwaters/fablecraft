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
        layerId: "layer-base",
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
      layerId: "layer-base",
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

  it("clears dirty local edits when an external snapshot arrives mid-edit", () => {
    const initialSnapshot = makeDocumentSnapshot();
    useDocumentStore.getState().hydrateSnapshot(initialSnapshot);

    useDocumentStore.getState().updateSnapshot((snapshot) =>
      replaceCardContent(snapshot, {
        cardId: "card-a",
        contentJson: markdownToContentJson("Local unsaved change"),
        layerId: "layer-base",
      }),
    );

    expect(useDocumentStore.getState().dirty).toBe(true);
    expect(useDocumentStore.getState().saveState).toBe("idle");

    const externalSnapshot = replaceCardContent(initialSnapshot, {
      cardId: "card-b",
      contentJson: markdownToContentJson("Remote update to card-b"),
      layerId: "layer-base",
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
        layerId: "layer-base",
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
