import { useEffect, useRef, useState, type WheelEvent as ReactWheelEvent } from "react";
import { CardEditor } from "./CardEditor";
import { TreeCardButton } from "./TreeCardButton";
import { buildCardNumberMap } from "../domain/document/cardNumbers";
import {
  canCreateCardsFromContent,
  cardContent,
  isContentEffectivelyEmpty,
  primaryLayerId,
  replaceCardContent,
  trimTrailingEmptyParagraphs,
} from "../domain/document/content";
import {
  firstChildCardId,
  parentCardId,
} from "../domain/document/navigation";
import { nextCardInColumn, previousCardInColumn, stageLayout } from "../domain/document/spatial";
import { splitCardContentAtTextOffset } from "../domain/document/split";
import { createChildCard, createSiblingAfter, createSiblingBefore, deleteCardSubtree, indentCardUnderPreviousSibling, mergeCardWithNextSibling, mergeCardWithPreviousSibling, moveCardWithinParent, outdentCard, unwrapCard, wrapLevelInParent } from "../domain/document/tree";
import { listenForFrontendMenuActions, type NativeMenuAction } from "../lib/nativeMenu";
import { randomId } from "../lib/randomId";
import { loadCurrentDocumentSnapshot } from "../storage/documentSnapshots";
import { useDocumentAutosave } from "../storage/useDocumentAutosave";
import { useExternalDocumentReload } from "../storage/useExternalDocumentReload";
import { useAppStore } from "../state/appStore";
import { useDocumentStore } from "../state/documentStore";
import { useInteractionStore } from "../state/interactionStore";
import { useSettingsStore } from "../state/settingsStore";
import { resolveUiMetrics } from "../styles/tokens";
import type { DocumentSnapshot } from "../domain/document/types";
import type { DocumentSummary } from "../types/document";

interface DocumentWorkspaceProps {
  document: DocumentSummary;
  suspendKeyboard?: boolean;
}

type EditorFocusPlacement = "end" | "start";

function cardHeightCacheKey(cardId: string) {
  return cardId;
}

function clampStageOffset(value: number, limit: number) {
  return Math.max(-limit, Math.min(limit, value));
}

function fallbackCardIdAfterDelete(snapshot: DocumentSnapshot, cardId: string) {
  return (
    nextCardInColumn(snapshot.cards, cardId) ??
    previousCardInColumn(snapshot.cards, cardId) ??
    parentCardId(snapshot.cards, cardId) ??
    null
  );
}

export function DocumentWorkspace({
  document,
  suspendKeyboard = false,
}: DocumentWorkspaceProps) {
  const activeCardShellRef = useRef<HTMLDivElement | null>(null);
  const wrappedParentSourceChildRef = useRef<Record<string, string>>({});
  const [pendingEditorFocusPlacement, setPendingEditorFocusPlacement] =
    useState<EditorFocusPlacement | null>(null);
  const [pendingEditorTextInput, setPendingEditorTextInput] = useState<string | null>(null);
  const [stageOffset, setStageOffset] = useState({ x: 0, y: 0 });
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const activeCardId = useInteractionStore((state) => state.activeCardId);
  const setActiveCardId = useInteractionStore((state) => state.setActiveCardId);
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const uiPreferences = useSettingsStore((state) => state.preferences);
  const applyNavigationChange = useDocumentStore(
    (state) => state.applyNavigationChange,
  );
  const hydrateSnapshot = useDocumentStore((state) => state.hydrateSnapshot);
  const redoNavigation = useDocumentStore((state) => state.redoNavigation);
  const redoEditing = useDocumentStore((state) => state.redoEditing);
  const snapshot = useDocumentStore((state) => state.snapshot);
  const undoNavigation = useDocumentStore((state) => state.undoNavigation);
  const undoEditing = useDocumentStore((state) => state.undoEditing);
  const updateSnapshot = useDocumentStore((state) => state.updateSnapshot);
  const uiMetrics = resolveUiMetrics(uiPreferences);

  function updateCardHeight(
    cardId: string,
    height: number,
    overwrite = true,
  ) {
    const normalizedHeight = Math.max(uiMetrics.cardHeight, Math.round(height));
    const cacheKey = cardHeightCacheKey(cardId);

    setCardHeights((currentHeights) => {
      if (!overwrite && currentHeights[cacheKey]) {
        return currentHeights;
      }

      if (currentHeights[cacheKey] === normalizedHeight) {
        return currentHeights;
      }

      return {
        ...currentHeights,
        [cacheKey]: normalizedHeight,
      };
    });
  }

  useDocumentAutosave();
  useExternalDocumentReload(document);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const nextSnapshot = await loadCurrentDocumentSnapshot();

        if (!cancelled) {
          hydrateSnapshot(nextSnapshot);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [document.documentId, hydrateSnapshot]);

  const activeSnapshot =
    snapshot?.summary.documentId === document.documentId ? snapshot : null;
  const contentLayerId = activeSnapshot ? primaryLayerId(activeSnapshot) : null;
  const layerCardHeights =
    activeSnapshot
      ? Object.fromEntries(
          activeSnapshot.cards
            .map((card) => {
              const cachedHeight = cardHeights[cardHeightCacheKey(card.id)];

              return cachedHeight ? [card.id, cachedHeight] : null;
            })
            .filter(
              (
                entry,
              ): entry is [string, number] => Array.isArray(entry),
            ),
        )
      : {};
  const selectedCard =
    activeSnapshot?.cards.find((card) => card.id === activeCardId) ?? null;
  const selectedCardContent =
    activeSnapshot && activeCardId
      ? cardContent(activeSnapshot, activeCardId, contentLayerId)
      : null;
  const canCreateStructure = selectedCardContent
    ? canCreateCardsFromContent(selectedCardContent)
    : false;
  const isSelectedCardEmpty = selectedCardContent
    ? isContentEffectivelyEmpty(selectedCardContent)
    : true;
  const isFirstRootCard = selectedCard?.parentId === null && selectedCard.orderIndex === 0;
  const canLeaveEditing =
    !selectedCard || !isFirstRootCard || !isSelectedCardEmpty;
  const activePlaceholder =
    isFirstRootCard ? "Your story starts here" : "";
  const positionedCards =
    activeSnapshot && activeCardId
      ? stageLayout(activeSnapshot.cards, activeCardId, {
          cardHeight: uiMetrics.cardHeight,
          cardHeights: layerCardHeights,
          cardWidth: uiMetrics.cardWidth,
          spacing: uiMetrics.spacing,
        }).map((position) => ({
          ...position,
          contentJson: cardContent(activeSnapshot, position.cardId, contentLayerId),
        }))
      : [];
  const stagePanLimit = positionedCards.reduce(
    (limits, card) => ({
      x: Math.max(limits.x, Math.abs(card.x) + uiMetrics.cardWidth),
      y: Math.max(limits.y, Math.abs(card.y) + card.height),
    }),
    { x: uiMetrics.cardWidth, y: uiMetrics.cardHeight },
  );
  const activeHorizontalPadding = 33;
  const activeTopPadding = 40;
  const activeBottomPadding = 23;
  const isEditingSelectedCard = mode === "editing";
  const cardNumbers = activeSnapshot ? buildCardNumberMap(activeSnapshot) : {};

  function focusCardForEditing(
    nextCardId: string | null,
    placement: EditorFocusPlacement = "end",
    textInput: string | null = null,
  ) {
    if (!nextCardId) {
      return false;
    }

    setActiveCardId(nextCardId);
    setPendingEditorFocusPlacement(placement);
    setPendingEditorTextInput(textInput);
    setMode("editing");
    return true;
  }

  function createRelativeCard(direction: "before" | "after" | "child") {
    if (!selectedCard || !selectedCardContent || !canCreateCardsFromContent(selectedCardContent)) {
      return false;
    }

    const newCardId = randomId("card");
    applyNavigationChange((snapshotToChange) => {
      if (direction === "before") {
        return createSiblingBefore(snapshotToChange, selectedCard.id, newCardId);
      }

      if (direction === "child") {
        return createChildCard(snapshotToChange, selectedCard.id, newCardId);
      }

      return createSiblingAfter(snapshotToChange, selectedCard.id, newCardId);
    });

    return focusCardForEditing(newCardId, "end");
  }

  function createParentLevel() {
    if (!selectedCard || !selectedCardContent || !canCreateCardsFromContent(selectedCardContent)) {
      return false;
    }

    const newCardId = randomId("card");
    wrappedParentSourceChildRef.current[newCardId] = selectedCard.id;
    applyNavigationChange((snapshotToChange) =>
      wrapLevelInParent(snapshotToChange, selectedCard.id, newCardId),
    );
    return focusCardForEditing(newCardId, "end");
  }

  function handleDeleteCurrentCard(cardId: string) {
    if (!activeSnapshot) {
      return false;
    }

    const fallbackCardId = fallbackCardIdAfterDelete(activeSnapshot, cardId);
    applyNavigationChange((snapshotToChange) =>
      deleteCardSubtree(snapshotToChange, cardId),
    );
    setActiveCardId(fallbackCardId);
    setPendingEditorFocusPlacement(null);
    setPendingEditorTextInput(null);
    return true;
  }

  function handleMergeCurrentCard(cardId: string, direction: "up" | "down") {
    applyNavigationChange((snapshotToChange) =>
      direction === "up"
        ? mergeCardWithPreviousSibling(snapshotToChange, cardId)
        : mergeCardWithNextSibling(snapshotToChange, cardId),
    );
    return focusCardForEditing(cardId, "end");
  }

  function handleFrontendMenuAction(action: NativeMenuAction) {
    if (
      suspendKeyboard ||
      !activeSnapshot ||
      !activeCardId ||
      mode === "search" ||
      mode === "command"
    ) {
      return;
    }

    if (action === "undo") {
      if (mode === "editing") {
        undoEditing();
      } else {
        undoNavigation();
      }
      return;
    }

    if (action === "redo") {
      if (mode === "editing") {
        redoEditing();
      } else {
        redoNavigation();
      }
      return;
    }

    if (action === "merge-with-above") {
      handleMergeCurrentCard(activeCardId, "up");
      return;
    }

    if (action === "merge-below") {
      handleMergeCurrentCard(activeCardId, "down");
      return;
    }

    if (action === "shift-up") {
      applyNavigationChange((snapshotToChange) =>
        moveCardWithinParent(snapshotToChange, activeCardId, -1),
      );
      return;
    }

    if (action === "shift-down") {
      applyNavigationChange((snapshotToChange) =>
        moveCardWithinParent(snapshotToChange, activeCardId, 1),
      );
      return;
    }

    if (action === "create-child") {
      createRelativeCard("child");
      return;
    }

    if (action === "create-parent") {
      createParentLevel();
      return;
    }

    if (action === "create-above") {
      createRelativeCard("before");
      return;
    }

    if (action === "create-below") {
      createRelativeCard("after");
    }
  }

  useEffect(() => {
    if (!activeSnapshot) {
      return;
    }

    const nextActiveCardId =
      activeCardId &&
      activeSnapshot.cards.some((card) => card.id === activeCardId)
        ? activeCardId
        : activeSnapshot.cards.find((card) => card.parentId === null)?.id ?? null;

    setActiveCardId(nextActiveCardId);
  }, [activeCardId, activeSnapshot, setActiveCardId]);

  useEffect(() => {
    setStageOffset({ x: 0, y: 0 });
  }, [activeCardId, document.documentId]);

  useEffect(() => {
    setCardHeights({});
  }, [
    document.documentId,
    uiMetrics.cardHeight,
    uiMetrics.cardWidth,
    uiPreferences.font,
    uiPreferences.lineHeight,
    uiPreferences.textSize,
  ]);

  useEffect(() => {
    if (!activeCardId) {
      return;
    }

    const cardElement = activeCardShellRef.current;

    if (!cardElement) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextHeight = cardElement.getBoundingClientRect().height;

      if (nextHeight && nextHeight > 0) {
        updateCardHeight(activeCardId, nextHeight, true);
      }
    });

    observer.observe(cardElement);

    return () => {
      observer.disconnect();
    };
  }, [activeCardId, mode, uiMetrics.cardHeight]);

  useEffect(() => {
    setStageOffset((currentOffset) => ({
      x: clampStageOffset(currentOffset.x, stagePanLimit.x),
      y: clampStageOffset(currentOffset.y, stagePanLimit.y),
    }));
  }, [stagePanLimit.x, stagePanLimit.y]);

  function leaveEditingMode() {
    if (!activeSnapshot || !activeCardId || !selectedCard) {
      setMode("navigation");
      return;
    }

    const hasChildren = activeSnapshot.cards.some(
      (card) => card.parentId === activeCardId,
    );
    const currentContent = cardContent(activeSnapshot, activeCardId, contentLayerId);

    if (
      selectedCard.parentId &&
      !hasChildren &&
      isContentEffectivelyEmpty(currentContent)
    ) {
      const fallbackCardId = fallbackCardIdAfterDelete(activeSnapshot, activeCardId);
      applyNavigationChange((currentSnapshot) =>
        deleteCardSubtree(currentSnapshot, activeCardId),
      );
      setActiveCardId(fallbackCardId);
    }

    setMode("navigation");
  }

  function handleStageWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaX) < 0.1 && Math.abs(event.deltaY) < 0.1) {
      return;
    }

    event.preventDefault();
    setStageOffset((currentOffset) => ({
      x: clampStageOffset(currentOffset.x - event.deltaX, stagePanLimit.x),
      y: clampStageOffset(currentOffset.y - event.deltaY, stagePanLimit.y),
    }));
  }

  useEffect(() => {
    if (!activeSnapshot || !activeCardId) {
      return;
    }

    const currentSnapshot = activeSnapshot;
    const currentCardId = activeCardId;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || suspendKeyboard) {
        return;
      }

      if (mode === "search" || mode === "command") {
        return;
      }

      if (mode === "editing") {
        if (event.key === "Escape") {
          event.preventDefault();
          leaveEditingMode();
        }

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        setPendingEditorFocusPlacement("end");
        setPendingEditorTextInput(null);
        setMode("editing");
        return;
      }

      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        focusCardForEditing(currentCardId, "end", event.key);
        return;
      }

      if ((event.key === "Backspace" || event.key === "Delete") && selectedCard?.parentId) {
        event.preventDefault();
        handleDeleteCurrentCard(currentCardId);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          createRelativeCard("before");
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          createRelativeCard("after");
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          createRelativeCard("child");
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          createParentLevel();
          return;
        }
      }

      if (event.shiftKey && event.key === "ArrowUp") {
        event.preventDefault();
        applyNavigationChange((snapshotToChange) =>
          moveCardWithinParent(snapshotToChange, currentCardId, -1),
        );
        return;
      }

      if (event.shiftKey && event.key === "ArrowDown") {
        event.preventDefault();
        applyNavigationChange((snapshotToChange) =>
          moveCardWithinParent(snapshotToChange, currentCardId, 1),
        );
        return;
      }

      if (
        event.altKey &&
        event.metaKey === false &&
        event.ctrlKey === false &&
        event.shiftKey === false &&
        event.key === "ArrowUp"
      ) {
        event.preventDefault();
        handleMergeCurrentCard(currentCardId, "up");
        return;
      }

      if (
        event.altKey &&
        event.metaKey === false &&
        event.ctrlKey === false &&
        event.shiftKey === false &&
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        handleMergeCurrentCard(currentCardId, "down");
        return;
      }

      if (event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        applyNavigationChange((snapshotToChange) =>
          outdentCard(snapshotToChange, currentCardId),
        );
        return;
      }

      if (event.shiftKey && event.key === "ArrowRight") {
        event.preventDefault();
        applyNavigationChange((snapshotToChange) =>
          indentCardUnderPreviousSibling(snapshotToChange, currentCardId),
        );
        return;
      }

      const nextCardId =
        event.key === "ArrowLeft"
          ? parentCardId(currentSnapshot.cards, currentCardId)
          : event.key === "ArrowRight"
            ? firstChildCardId(currentSnapshot.cards, currentCardId)
            : event.key === "ArrowUp"
              ? previousCardInColumn(currentSnapshot.cards, currentCardId)
              : event.key === "ArrowDown"
                ? nextCardInColumn(currentSnapshot.cards, currentCardId)
                : null;

      if (!nextCardId) {
        return;
      }

      event.preventDefault();
      setActiveCardId(nextCardId);
      setPendingEditorFocusPlacement(null);
      setPendingEditorTextInput(null);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeCardId,
    activeSnapshot,
    applyNavigationChange,
    mode,
    redoNavigation,
    redoEditing,
    selectedCard?.parentId,
    selectedCardContent,
    setActiveCardId,
    setMode,
    suspendKeyboard,
    undoNavigation,
    undoEditing,
  ]);

  useEffect(() => listenForFrontendMenuActions(handleFrontendMenuAction), [
    activeCardId,
    activeSnapshot,
    applyNavigationChange,
    canCreateStructure,
    mode,
    redoNavigation,
    redoEditing,
    selectedCard,
    selectedCardContent,
    suspendKeyboard,
    undoNavigation,
    undoEditing,
  ]);

  return (
    <section className="relative flex h-full w-full items-stretch overflow-hidden">
      <div
        className="relative h-full w-full overflow-hidden"
        onWheel={handleStageWheel}
      >
        {positionedCards.map((card) =>
                card.isActive &&
                selectedCard &&
                selectedCardContent ? (
                  <div
                    data-testid="active-card-shell"
                    className="absolute flex w-[var(--fc-card-width)] flex-col justify-start border bg-[var(--fc-color-surface)] px-5 py-[10px] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                    ref={activeCardShellRef}
                    key={card.cardId}
                    onClick={() => setMode("editing")}
                    role="presentation"
                    style={{
                      backgroundColor: "var(--fc-color-surface)",
                      borderColor: "transparent",
                      borderWidth: "0px",
                      boxShadow: isEditingSelectedCard
                        ? "var(--fc-shadow-elevated)"
                        : "0 18px 34px rgba(23, 20, 18, 0.16)",
                      left: `calc(50% + ${card.x + stageOffset.x}px)`,
                      minHeight: `${card.height}px`,
                      paddingBottom: `${activeBottomPadding}px`,
                      paddingLeft: `${activeHorizontalPadding}px`,
                      paddingRight: `${activeHorizontalPadding}px`,
                      paddingTop: `${activeTopPadding}px`,
                      top: `calc(50% + ${card.y + stageOffset.y}px)`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 2,
                    }}
                  >
                    <p className="pointer-events-none absolute right-[28px] top-[18px] font-[var(--fc-font-ui)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:rgba(23,20,18,0.34)]">
                      {cardNumbers[selectedCard.id] ?? selectedCard.id.toUpperCase()}
                    </p>
                    <CardEditor
                      canLeaveEditing={canLeaveEditing}
                      canCreateStructure={canCreateStructure}
                      focusPlacement={pendingEditorFocusPlacement}
                      key={selectedCard.id}
                      contentJson={selectedCardContent}
                      isEditing={mode === "editing"}
                      onConsumeFocusPlacement={() => setPendingEditorFocusPlacement(null)}
                      onConsumePendingTextInput={() => setPendingEditorTextInput(null)}
                      onCreateBelow={() => {
                        if (!canCreateStructure) {
                          return;
                        }

                        const newCardId = randomId("card");
                        applyNavigationChange((snapshotToChange) => {
                          if (!contentLayerId) {
                            return snapshotToChange;
                          }

                          let nextSnapshot = createSiblingAfter(
                            snapshotToChange,
                            selectedCard.id,
                            newCardId,
                          );

                          return replaceCardContent(nextSnapshot, {
                            cardId: selectedCard.id,
                            contentJson: trimTrailingEmptyParagraphs(
                              cardContent(nextSnapshot, selectedCard.id, contentLayerId),
                            ),
                            layerId: contentLayerId,
                          });
                        });
                        focusCardForEditing(newCardId, "end");
                      }}
                      onCreateChild={() => {
                        if (!canCreateStructure) {
                          return;
                        }

                        const newCardId = randomId("card");
                        applyNavigationChange((snapshotToChange) =>
                          createChildCard(snapshotToChange, selectedCard.id, newCardId),
                        );
                        focusCardForEditing(newCardId, "end");
                      }}
                      onDeleteEmpty={() => {
                        if (!activeSnapshot || !isSelectedCardEmpty) {
                          return;
                        }

                        const hasChildren = activeSnapshot.cards.some(
                          (card) => card.parentId === selectedCard.id,
                        );

                        if (hasChildren) {
                          const fallbackCardId =
                            wrappedParentSourceChildRef.current[selectedCard.id] ??
                            firstChildCardId(activeSnapshot.cards, selectedCard.id);
                          applyNavigationChange((snapshotToChange) =>
                            unwrapCard(snapshotToChange, selectedCard.id),
                          );
                          delete wrappedParentSourceChildRef.current[selectedCard.id];
                          focusCardForEditing(fallbackCardId, "end");
                          return;
                        }

                        const isLastRootCard =
                          selectedCard.parentId === null &&
                          activeSnapshot.cards.filter((card) => card.parentId === null).length === 1;

                        if (isLastRootCard) {
                          return;
                        }

                        const fallbackCardId = fallbackCardIdAfterDelete(
                          activeSnapshot,
                          selectedCard.id,
                        );
                        applyNavigationChange((snapshotToChange) =>
                          deleteCardSubtree(snapshotToChange, selectedCard.id),
                        );
                        focusCardForEditing(fallbackCardId, "end");
                      }}
                      onMergeAbove={() => {
                        applyNavigationChange((snapshotToChange) =>
                          mergeCardWithPreviousSibling(snapshotToChange, selectedCard.id),
                        );
                        return focusCardForEditing(selectedCard.id, "end");
                      }}
                      onMergeBelow={() => {
                        applyNavigationChange((snapshotToChange) =>
                          mergeCardWithNextSibling(snapshotToChange, selectedCard.id),
                        );
                        return focusCardForEditing(selectedCard.id, "end");
                      }}
                      onCreateParentLevel={() => {
                        if (!canCreateStructure) {
                          return;
                        }

                        const newCardId = randomId("card");
                        wrappedParentSourceChildRef.current[newCardId] = selectedCard.id;
                        applyNavigationChange((snapshotToChange) =>
                          wrapLevelInParent(snapshotToChange, selectedCard.id, newCardId),
                        );
                        focusCardForEditing(newCardId, "end");
                      }}
                      onCreateSiblingAbove={() => {
                        if (!canCreateStructure) {
                          return;
                        }

                        const newCardId = randomId("card");
                        applyNavigationChange((snapshotToChange) =>
                          createSiblingBefore(snapshotToChange, selectedCard.id, newCardId),
                        );
                        focusCardForEditing(newCardId, "end");
                      }}
                      onCreateSiblingBelow={() => {
                        if (!canCreateStructure) {
                          return;
                        }

                        const newCardId = randomId("card");
                        applyNavigationChange((snapshotToChange) =>
                          createSiblingAfter(snapshotToChange, selectedCard.id, newCardId),
                        );
                        focusCardForEditing(newCardId, "end");
                      }}
                      onNavigateChild={() => {
                        if (!activeSnapshot) {
                          return false;
                        }

                        return focusCardForEditing(
                          firstChildCardId(activeSnapshot.cards, selectedCard.id),
                          "start",
                        );
                      }}
                      onNavigateParent={() => {
                        if (!activeSnapshot) {
                          return false;
                        }

                        return focusCardForEditing(
                          parentCardId(activeSnapshot.cards, selectedCard.id),
                          "end",
                        );
                      }}
                      onNavigateAbove={() => {
                        if (!activeSnapshot) {
                          return false;
                        }

                        const previousCardId = previousCardInColumn(
                          activeSnapshot.cards,
                          selectedCard.id,
                        );

                        if (!previousCardId) {
                          return false;
                        }

                        return focusCardForEditing(previousCardId, "end");
                      }}
                      onNavigateBelow={() => {
                        if (!activeSnapshot) {
                          return false;
                        }

                        const nextCardId = nextCardInColumn(
                          activeSnapshot.cards,
                          selectedCard.id,
                        );

                        if (!nextCardId) {
                          return false;
                        }

                        return focusCardForEditing(nextCardId, "start");
                      }}
                      pendingTextInput={pendingEditorTextInput}
                      placeholder={activePlaceholder}
                      onRedo={redoEditing}
                      onRequestNavigation={leaveEditingMode}
                      onUndo={undoEditing}
                      onSplitAtSelection={(selectionStart, selectionEnd) => {
                        const splitContent = splitCardContentAtTextOffset(
                          selectedCardContent,
                          selectionStart,
                          selectionEnd,
                        );
                        const newCardId = randomId("card");

                        applyNavigationChange((snapshotToChange) => {
                          if (!contentLayerId) {
                            return snapshotToChange;
                          }

                          let nextSnapshot = createSiblingAfter(
                            snapshotToChange,
                            selectedCard.id,
                            newCardId,
                          );
                          nextSnapshot = replaceCardContent(nextSnapshot, {
                            cardId: selectedCard.id,
                            contentJson: splitContent.before,
                            layerId: contentLayerId,
                          });

                          return replaceCardContent(nextSnapshot, {
                            cardId: newCardId,
                            contentJson: splitContent.after,
                            layerId: contentLayerId,
                          });
                        });

                        focusCardForEditing(newCardId, "end");
                      }}
                      onUpdateContent={(contentJson) => {
                        updateSnapshot((snapshotToChange) =>
                          contentLayerId
                            ? replaceCardContent(snapshotToChange, {
                                cardId: selectedCard.id,
                                contentJson,
                                layerId: contentLayerId,
                              })
                            : snapshotToChange,
                        );
                      }}
                    />
                  </div>
                ) : (
                  <TreeCardButton
                    borderColor="transparent"
                    cardLabel={cardNumbers[card.cardId] ?? card.cardId.toUpperCase()}
                    contentJson={card.contentJson}
                    isActive={card.isActive}
                    isNeighborhood={card.isNeighborhood}
                    key={card.cardId}
                    onMeasureHeight={(height) => {
                      updateCardHeight(card.cardId, height, true);
                    }}
                    onClick={() => {
                      setActiveCardId(card.cardId);
                      setPendingEditorFocusPlacement("end");
                      setPendingEditorTextInput(null);
                      setMode("editing");
                    }}
                    x={card.x + stageOffset.x}
                    y={card.y + stageOffset.y}
                  />
                ),
              )}
      </div>
    </section>
  );
}
