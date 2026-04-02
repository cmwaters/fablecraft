import { createLayer } from "../src/domain/document/layers";
import {
  createDocumentHistoryState,
  recordDocumentHistory,
  redoDocumentHistory,
  undoDocumentHistory,
} from "../src/domain/document/history";
import { makeDocumentSnapshot } from "./documentSnapshotFactory";

describe("document history", () => {
  it("records mode-specific history entries", () => {
    const initialSnapshot = makeDocumentSnapshot();
    const nextSnapshot = createLayer(initialSnapshot, "layer-red", "Plot");

    const history = recordDocumentHistory(
      createDocumentHistoryState(initialSnapshot),
      "navigation",
      nextSnapshot,
    );

    expect(history.past.navigation).toHaveLength(1);
    expect(history.past.editing).toHaveLength(0);
    expect(history.present.layers).toHaveLength(2);
  });

  it("undos within the active mode without touching the other stack", () => {
    const initialSnapshot = makeDocumentSnapshot();
    const afterNavigation = createLayer(initialSnapshot, "layer-red", "Plot");
    const afterEditing = createLayer(afterNavigation, "layer-blue", "Theme");

    const historyAfterNavigation = recordDocumentHistory(
      createDocumentHistoryState(initialSnapshot),
      "navigation",
      afterNavigation,
    );
    const historyAfterEditing = recordDocumentHistory(
      historyAfterNavigation,
      "editing",
      afterEditing,
    );
    const undoneHistory = undoDocumentHistory(historyAfterEditing, "editing");

    expect(undoneHistory.present.layers).toHaveLength(2);
    expect(undoneHistory.future.editing).toHaveLength(1);
    expect(undoneHistory.past.navigation).toHaveLength(1);
  });

  it("redos within the active mode after an undo", () => {
    const initialSnapshot = makeDocumentSnapshot();
    const afterNavigation = createLayer(initialSnapshot, "layer-red", "Plot");
    const afterEditing = createLayer(afterNavigation, "layer-blue", "Theme");

    const historyAfterNavigation = recordDocumentHistory(
      createDocumentHistoryState(initialSnapshot),
      "navigation",
      afterNavigation,
    );
    const historyAfterEditing = recordDocumentHistory(
      historyAfterNavigation,
      "editing",
      afterEditing,
    );
    const undoneHistory = undoDocumentHistory(historyAfterEditing, "editing");
    const redoneHistory = redoDocumentHistory(undoneHistory, "editing");

    expect(redoneHistory.present.layers).toHaveLength(3);
    expect(redoneHistory.future.editing).toHaveLength(0);
    expect(redoneHistory.past.editing).toHaveLength(1);
  });
});
