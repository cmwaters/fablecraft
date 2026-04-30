import { contentJsonForPlainText, replaceCardContent } from "../src/domain/document/content";
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
    const nextSnapshot = replaceCardContent(initialSnapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Navigation edit"),
    });

    const history = recordDocumentHistory(
      createDocumentHistoryState(initialSnapshot),
      "navigation",
      nextSnapshot,
    );

    expect(history.past.navigation).toHaveLength(1);
    expect(history.past.editing).toHaveLength(0);
    expect(history.present.contents.find((content) => content.cardId === "card-a")?.contentJson).toContain("Navigation edit");
  });

  it("undos within the active mode without touching the other stack", () => {
    const initialSnapshot = makeDocumentSnapshot();
    const afterNavigation = replaceCardContent(initialSnapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Navigation edit"),
    });
    const afterEditing = replaceCardContent(afterNavigation, {
      cardId: "card-b",
      contentJson: contentJsonForPlainText("Editing edit"),
    });

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

    expect(undoneHistory.present.contents.find((content) => content.cardId === "card-b")?.contentJson).not.toContain("Editing edit");
    expect(undoneHistory.future.editing).toHaveLength(1);
    expect(undoneHistory.past.navigation).toHaveLength(1);
  });

  it("redos within the active mode after an undo", () => {
    const initialSnapshot = makeDocumentSnapshot();
    const afterNavigation = replaceCardContent(initialSnapshot, {
      cardId: "card-a",
      contentJson: contentJsonForPlainText("Navigation edit"),
    });
    const afterEditing = replaceCardContent(afterNavigation, {
      cardId: "card-b",
      contentJson: contentJsonForPlainText("Editing edit"),
    });

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

    expect(redoneHistory.present.contents.find((content) => content.cardId === "card-b")?.contentJson).toContain("Editing edit");
    expect(redoneHistory.future.editing).toHaveLength(0);
    expect(redoneHistory.past.editing).toHaveLength(1);
  });
});
