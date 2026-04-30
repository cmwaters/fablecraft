import { EMPTY_EDITOR_DOCUMENT_JSON } from "./editorDocument";
import { normalizeDocumentSnapshot } from "./serialization";
import { cardContent, mergeCardContentJson } from "./content";
import { nextCardInColumn, previousCardInColumn } from "./spatial";
import type { CardRecord, DocumentSnapshot } from "./types";

function reindexCards(cards: CardRecord[], parentId: string | null) {
  return cards
    .filter((card) => card.parentId === parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id))
    .map((card, index) => ({ ...card, orderIndex: index }));
}

function replaceSiblingGroup(
  cards: CardRecord[],
  parentId: string | null,
  replacement: CardRecord[],
) {
  return cards
    .filter((card) => card.parentId !== parentId)
    .concat(replacement)
    .sort((left, right) => {
      if (left.parentId !== right.parentId) {
        return (left.parentId ?? "").localeCompare(right.parentId ?? "");
      }

      return left.orderIndex - right.orderIndex || left.id.localeCompare(right.id);
    });
}

function collectDescendantIds(cards: CardRecord[], cardId: string) {
  const descendantIds = new Set<string>([cardId]);
  const queue = [cardId];

  while (queue.length > 0) {
    const currentCardId = queue.shift()!;
    const directChildren = cards.filter((card) => card.parentId === currentCardId);

    directChildren.forEach((child) => {
      descendantIds.add(child.id);
      queue.push(child.id);
    });
  }

  return descendantIds;
}

function createCardRecord(
  snapshot: DocumentSnapshot,
  card: Pick<CardRecord, "id" | "parentId" | "orderIndex">,
) {
  return {
    documentId: snapshot.summary.documentId,
    id: card.id,
    orderIndex: card.orderIndex,
    parentId: card.parentId,
    type: "card" as const,
  };
}

function upsertContentRecord(
  contents: DocumentSnapshot["contents"],
  cardId: string,
  contentJson: string,
) {
  const existingIndex = contents.findIndex((content) => content.cardId === cardId);

  if (existingIndex === -1) {
    return contents.concat({ cardId, contentJson });
  }

  return contents.map((content, index) =>
    index === existingIndex ? { ...content, contentJson } : content,
  );
}

export function createChildCard(
  snapshot: DocumentSnapshot,
  parentId: string,
  cardId: string,
) {
  const siblingCards = snapshot.cards.filter((card) => card.parentId === parentId);
  const nextCard = createCardRecord(snapshot, {
    id: cardId,
    orderIndex: siblingCards.length,
    parentId,
  });

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: snapshot.cards.concat(nextCard),
    contents: snapshot.contents.concat({
      cardId,
      contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
    }),
  });
}

export function createSiblingAfter(
  snapshot: DocumentSnapshot,
  siblingId: string,
  cardId: string,
) {
  const sibling = snapshot.cards.find((card) => card.id === siblingId);

  if (!sibling) {
    throw new Error(`Unable to create sibling for missing card ${siblingId}.`);
  }

  const siblingGroup = snapshot.cards
    .filter((card) => card.parentId === sibling.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));

  const insertionIndex = siblingGroup.findIndex((card) => card.id === siblingId) + 1;
  const nextGroup = siblingGroup
    .slice(0, insertionIndex)
    .concat(createCardRecord(snapshot, { id: cardId, orderIndex: insertionIndex, parentId: sibling.parentId }))
    .concat(siblingGroup.slice(insertionIndex))
    .map((card, index) => ({ ...card, orderIndex: index }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(snapshot.cards, sibling.parentId, nextGroup),
    contents: snapshot.contents.concat({
      cardId,
      contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
    }),
  });
}

export function createSiblingBefore(
  snapshot: DocumentSnapshot,
  siblingId: string,
  cardId: string,
) {
  const sibling = snapshot.cards.find((card) => card.id === siblingId);

  if (!sibling) {
    throw new Error(`Unable to create sibling for missing card ${siblingId}.`);
  }

  const siblingGroup = snapshot.cards
    .filter((card) => card.parentId === sibling.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));

  const insertionIndex = siblingGroup.findIndex((card) => card.id === siblingId);
  const nextGroup = siblingGroup
    .slice(0, insertionIndex)
    .concat(
      createCardRecord(snapshot, {
        id: cardId,
        orderIndex: insertionIndex,
        parentId: sibling.parentId,
      }),
    )
    .concat(siblingGroup.slice(insertionIndex))
    .map((card, index) => ({ ...card, orderIndex: index }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(snapshot.cards, sibling.parentId, nextGroup),
    contents: snapshot.contents.concat({
      cardId,
      contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
    }),
  });
}

export function wrapLevelInParent(
  snapshot: DocumentSnapshot,
  cardId: string,
  newParentId: string,
) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card) {
    throw new Error(`Unable to wrap missing card ${cardId}.`);
  }

  const siblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const wrappedIds = new Set(siblingGroup.map((candidate) => candidate.id));
  const nextParent = createCardRecord(snapshot, {
    id: newParentId,
    orderIndex: 0,
    parentId: card.parentId,
  });
  const wrappedChildren = siblingGroup.map((candidate, index) => ({
    ...candidate,
    orderIndex: index,
    parentId: newParentId,
  }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: snapshot.cards
      .filter((candidate) => !wrappedIds.has(candidate.id))
      .concat(nextParent, wrappedChildren),
    contents: snapshot.contents.concat({
      cardId: newParentId,
      contentJson: EMPTY_EDITOR_DOCUMENT_JSON,
    }),
  });
}

export function moveCardWithinParent(
  snapshot: DocumentSnapshot,
  cardId: string,
  direction: -1 | 1,
) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card) {
    throw new Error(`Unable to move missing card ${cardId}.`);
  }

  const siblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const currentIndex = siblingGroup.findIndex((candidate) => candidate.id === cardId);
  const targetIndex = currentIndex + direction;

  if (targetIndex < 0 || targetIndex >= siblingGroup.length) {
    const columnNeighborId =
      direction === -1
        ? previousCardInColumn(snapshot.cards, cardId)
        : nextCardInColumn(snapshot.cards, cardId);
    const columnNeighbor = snapshot.cards.find(
      (candidate) => candidate.id === columnNeighborId,
    );

    if (!columnNeighbor) {
      return normalizeDocumentSnapshot(snapshot);
    }

    const sourceSiblingGroup = siblingGroup
      .filter((candidate) => candidate.id !== cardId)
      .map((candidate, index) => ({ ...candidate, orderIndex: index }));
    const targetSiblingGroup = snapshot.cards
      .filter(
        (candidate) =>
          candidate.parentId === columnNeighbor.parentId && candidate.id !== cardId,
      )
      .sort(
        (left, right) =>
          left.orderIndex - right.orderIndex || left.id.localeCompare(right.id),
      );
    const neighborIndex = targetSiblingGroup.findIndex(
      (candidate) => candidate.id === columnNeighbor.id,
    );
    const insertionIndex =
      direction === -1 ? neighborIndex : neighborIndex + 1;

    if (neighborIndex === -1) {
      return normalizeDocumentSnapshot(snapshot);
    }

    const reparentedCard = {
      ...card,
      orderIndex: insertionIndex,
      parentId: columnNeighbor.parentId,
    };
    const nextTargetGroup = targetSiblingGroup
      .slice(0, insertionIndex)
      .concat(reparentedCard)
      .concat(targetSiblingGroup.slice(insertionIndex))
      .map((candidate, index) => ({ ...candidate, orderIndex: index }));

    return normalizeDocumentSnapshot({
      ...snapshot,
      cards: replaceSiblingGroup(
        replaceSiblingGroup(
          snapshot.cards.filter((candidate) => candidate.id !== cardId),
          card.parentId,
          sourceSiblingGroup,
        ),
        columnNeighbor.parentId,
        nextTargetGroup,
      ),
    });
  }

  const nextGroup = [...siblingGroup];
  const [movingCard] = nextGroup.splice(currentIndex, 1);
  nextGroup.splice(targetIndex, 0, movingCard);

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(
      snapshot.cards,
      card.parentId,
      nextGroup.map((candidate, index) => ({ ...candidate, orderIndex: index })),
    ),
  });
}

export function outdentCard(snapshot: DocumentSnapshot, cardId: string) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card || !card.parentId) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const parent = snapshot.cards.find((candidate) => candidate.id === card.parentId);

  if (!parent) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const oldSiblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId && candidate.id !== cardId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id))
    .map((candidate, index) => ({ ...candidate, orderIndex: index }));

  const newParentId = parent.parentId;
  const targetSiblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === newParentId && candidate.id !== cardId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const parentIndex = targetSiblingGroup.findIndex((candidate) => candidate.id === parent.id);

  const nextTargetGroup = targetSiblingGroup
    .slice(0, parentIndex + 1)
    .concat({
      ...card,
      orderIndex: parentIndex + 1,
      parentId: newParentId,
    })
    .concat(targetSiblingGroup.slice(parentIndex + 1))
    .map((candidate, index) => ({ ...candidate, orderIndex: index }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(
      replaceSiblingGroup(snapshot.cards.filter((candidate) => candidate.id !== cardId), card.parentId, oldSiblingGroup),
      newParentId,
      nextTargetGroup,
    ),
  });
}

export function unwrapCard(snapshot: DocumentSnapshot, cardId: string) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const childGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === cardId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));

  if (childGroup.length === 0) {
    return deleteCardSubtree(snapshot, cardId);
  }

  const siblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId && candidate.id !== cardId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const insertionIndex = Math.max(0, Math.min(card.orderIndex, siblingGroup.length));
  const nextSiblingGroup = siblingGroup
    .slice(0, insertionIndex)
    .concat(
      childGroup.map((candidate) => ({
        ...candidate,
        parentId: card.parentId,
      })),
    )
    .concat(siblingGroup.slice(insertionIndex))
    .map((candidate, index) => ({ ...candidate, orderIndex: index }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(
      replaceSiblingGroup(
        snapshot.cards.filter((candidate) => candidate.id !== cardId),
        cardId,
        [],
      ),
      card.parentId,
      nextSiblingGroup,
    ),
    contents: snapshot.contents.filter((content) => content.cardId !== cardId),
  });
}

export function indentCardUnderPreviousSibling(
  snapshot: DocumentSnapshot,
  cardId: string,
) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card || !card.parentId) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const siblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const currentIndex = siblingGroup.findIndex((candidate) => candidate.id === cardId);

  if (currentIndex <= 0) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const previousSibling = siblingGroup[currentIndex - 1]!;
  const nextSiblingGroup = siblingGroup
    .filter((candidate) => candidate.id !== cardId)
    .map((candidate, index) => ({ ...candidate, orderIndex: index }));
  const targetChildren = snapshot.cards
    .filter((candidate) => candidate.parentId === previousSibling.id)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const nextTargetChildren = targetChildren
    .concat({
      ...card,
      orderIndex: targetChildren.length,
      parentId: previousSibling.id,
    })
    .map((candidate, index) => ({ ...candidate, orderIndex: index }));

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(
      replaceSiblingGroup(
        snapshot.cards.filter((candidate) => candidate.id !== cardId),
        card.parentId,
        nextSiblingGroup,
      ),
      previousSibling.id,
      nextTargetChildren,
    ),
  });
}

function mergeCardIntoTargetSibling(
  snapshot: DocumentSnapshot,
  targetId: string,
  sourceId: string,
  sourceFirst: boolean,
) {
  const targetCard = snapshot.cards.find((candidate) => candidate.id === targetId);
  const sourceCard = snapshot.cards.find((candidate) => candidate.id === sourceId);

  if (!targetCard || !sourceCard || targetCard.parentId !== sourceCard.parentId) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const remainingSiblings = snapshot.cards
    .filter(
      (candidate) =>
        candidate.parentId === targetCard.parentId &&
        candidate.id !== targetId &&
        candidate.id !== sourceId,
    )
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const nextSiblingGroup = remainingSiblings
    .concat({
      ...targetCard,
      orderIndex: sourceFirst ? sourceCard.orderIndex : targetCard.orderIndex,
    })
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id))
    .map((candidate, index) => ({ ...candidate, orderIndex: index }));
  const sourceChildren = snapshot.cards
    .filter((candidate) => candidate.parentId === sourceId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const targetChildren = snapshot.cards
    .filter((candidate) => candidate.parentId === targetId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const nextChildGroup = (sourceFirst
    ? sourceChildren.concat(targetChildren)
    : targetChildren.concat(sourceChildren)
  ).map((candidate, index) => ({
    ...candidate,
    orderIndex: index,
    parentId: targetId,
  }));

  const nextContents = upsertContentRecord(
    snapshot.contents.filter((content) => content.cardId !== sourceId),
    targetId,
    mergeCardContentJson(
      sourceFirst ? cardContent(snapshot, sourceId) : cardContent(snapshot, targetId),
      sourceFirst ? cardContent(snapshot, targetId) : cardContent(snapshot, sourceId),
    ),
  );

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: replaceSiblingGroup(
      replaceSiblingGroup(
        replaceSiblingGroup(
          snapshot.cards.filter((candidate) => candidate.id !== sourceId),
          sourceId,
          [],
        ),
        targetCard.parentId,
        nextSiblingGroup,
      ),
      targetId,
      nextChildGroup,
    ),
    contents: nextContents,
  });
}

export function mergeCardWithPreviousSibling(
  snapshot: DocumentSnapshot,
  cardId: string,
) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const siblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const currentIndex = siblingGroup.findIndex((candidate) => candidate.id === cardId);

  if (currentIndex <= 0) {
    return normalizeDocumentSnapshot(snapshot);
  }

  return mergeCardIntoTargetSibling(
    snapshot,
    cardId,
    siblingGroup[currentIndex - 1]!.id,
    true,
  );
}

export function mergeCardWithNextSibling(
  snapshot: DocumentSnapshot,
  cardId: string,
) {
  const card = snapshot.cards.find((candidate) => candidate.id === cardId);

  if (!card) {
    return normalizeDocumentSnapshot(snapshot);
  }

  const siblingGroup = snapshot.cards
    .filter((candidate) => candidate.parentId === card.parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
  const currentIndex = siblingGroup.findIndex((candidate) => candidate.id === cardId);

  if (currentIndex === -1 || currentIndex >= siblingGroup.length - 1) {
    return normalizeDocumentSnapshot(snapshot);
  }

  return mergeCardIntoTargetSibling(
    snapshot,
    cardId,
    siblingGroup[currentIndex + 1]!.id,
    false,
  );
}

export function deleteCardSubtree(snapshot: DocumentSnapshot, cardId: string) {
  const remainingRootCards = snapshot.cards.filter((card) => card.parentId === null);

  if (remainingRootCards.length === 1 && remainingRootCards[0]?.id === cardId) {
    throw new Error("The last root card cannot be deleted.");
  }

  const deletedIds = collectDescendantIds(snapshot.cards, cardId);
  const removedCard = snapshot.cards.find((card) => card.id === cardId);
  const nextCards = snapshot.cards.filter((card) => !deletedIds.has(card.id));
  const reindexedSiblings = removedCard
    ? reindexCards(nextCards, removedCard.parentId)
    : nextCards;

  return normalizeDocumentSnapshot({
    ...snapshot,
    cards: removedCard
      ? replaceSiblingGroup(nextCards, removedCard.parentId, reindexedSiblings)
      : nextCards,
    contents: snapshot.contents.filter((content) => !deletedIds.has(content.cardId)),
  });
}
