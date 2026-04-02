import type { CardRecord } from "./types";

export interface SpatialCardPosition {
  cardId: string;
  column: number;
  row: number;
}

export interface StageLayoutOptions {
  activeCardHeight?: number;
  cardHeight: number;
  cardHeights?: Record<string, number>;
  cardWidth: number;
  spacing: number;
}

export interface StageCardLayout {
  cardId: string;
  height: number;
  isActive: boolean;
  isNeighborhood: boolean;
  x: number;
  y: number;
}

function sortedChildren(cards: CardRecord[], parentId: string | null) {
  return cards
    .filter((card) => card.parentId === parentId)
    .sort(
      (left, right) =>
        left.orderIndex - right.orderIndex || left.id.localeCompare(right.id),
    );
}

function descendantIdsOfCard(cards: CardRecord[], cardId: string) {
  const descendants: string[] = [];
  const queue = [cardId];

  while (queue.length > 0) {
    const currentCardId = queue.shift()!;
    const childIds = sortedChildren(cards, currentCardId).map((card) => card.id);

    descendants.push(...childIds);
    queue.push(...childIds);
  }

  return descendants;
}

export function ancestorsOfCard(cards: CardRecord[], cardId: string) {
  const ancestors: CardRecord[] = [];
  let currentCard = cards.find((card) => card.id === cardId) ?? null;

  while (currentCard?.parentId) {
    const parentId = currentCard.parentId;
    const parent = cards.find((card) => card.id === parentId) ?? null;

    if (!parent) {
      break;
    }

    ancestors.unshift(parent);
    currentCard = parent;
  }

  return ancestors;
}

export function siblingsOfCard(cards: CardRecord[], cardId: string) {
  const currentCard = cards.find((card) => card.id === cardId);

  if (!currentCard) {
    return [];
  }

  return sortedChildren(cards, currentCard.parentId);
}

export function childrenOfCard(cards: CardRecord[], cardId: string) {
  return sortedChildren(cards, cardId);
}

export function treeLayout(cards: CardRecord[]) {
  const positions = new Map<string, SpatialCardPosition>();
  const roots = sortedChildren(cards, null);
  const nextRowByColumn = new Map<number, number>();

  function assignPosition(cardId: string, column: number) {
    const row = nextRowByColumn.get(column) ?? 0;
    nextRowByColumn.set(column, row + 1);
    positions.set(cardId, { cardId, column, row });
    const children = sortedChildren(cards, cardId);
    children.forEach((child) => assignPosition(child.id, column + 1));
  }

  roots.forEach((root) => assignPosition(root.id, 0));

  return cards
    .map((card) => positions.get(card.id))
    .filter((position): position is SpatialCardPosition => Boolean(position))
    .sort(
      (left, right) =>
        left.column - right.column ||
        left.row - right.row ||
        left.cardId.localeCompare(right.cardId),
    );
}

function packColumn(
  columnCards: SpatialCardPosition[],
  desiredCenters: Map<string, number>,
  spacing: number,
  heightForCardId: (cardId: string) => number,
) {
  interface IsotonicBlock {
    average: number;
    end: number;
    start: number;
    weight: number;
  }

  if (columnCards.length === 0) {
    return new Map<string, number>();
  }

  const heights = columnCards.map((card) => heightForCardId(card.cardId));
  const desiredTops = columnCards.map((card, index) => {
    const desiredCenter =
      desiredCenters.get(card.cardId) ??
      (index === 0 ? 0 : heights[index]! / 2);

    return desiredCenter - heights[index]! / 2;
  });
  const cumulativeOffsets: number[] = [];
  let runningOffset = 0;

  for (let index = 0; index < columnCards.length; index += 1) {
    cumulativeOffsets[index] = runningOffset;
    runningOffset += heights[index]! + spacing;
  }

  const targets = desiredTops.map(
    (desiredTop, index) => desiredTop - cumulativeOffsets[index]!,
  );
  const blocks: IsotonicBlock[] = [];

  targets.forEach((target, index) => {
    blocks.push({
      average: target,
      end: index,
      start: index,
      weight: 1,
    });

    while (
      blocks.length > 1 &&
      blocks[blocks.length - 2]!.average > blocks[blocks.length - 1]!.average
    ) {
      const right = blocks.pop()!;
      const left = blocks.pop()!;
      const weight = left.weight + right.weight;

      blocks.push({
        average:
          (left.average * left.weight + right.average * right.weight) / weight,
        end: right.end,
        start: left.start,
        weight,
      });
    }
  });

  const normalizedTops: number[] = Array(columnCards.length).fill(0);

  blocks.forEach((block) => {
    for (let index = block.start; index <= block.end; index += 1) {
      normalizedTops[index] = block.average;
    }
  });

  const packedCenters = new Map<string, number>();

  columnCards.forEach((card, index) => {
    const top = normalizedTops[index]! + cumulativeOffsets[index]!;
    const center = top + heights[index]! / 2;

    packedCenters.set(card.cardId, center);
  });

  return packedCenters;
}

function repackColumnAroundAnchor(
  cards: CardRecord[],
  columnCards: SpatialCardPosition[],
  anchorCardId: string,
  spacing: number,
  heightForCardId: (cardId: string) => number,
  yByCard: Map<string, number>,
) {
  const anchorIndex = columnCards.findIndex((card) => card.cardId === anchorCardId);

  if (columnCards.length === 0 || anchorIndex === -1) {
    return;
  }

  const previousYByCard = new Map(yByCard);
  yByCard.set(anchorCardId, 0);

  for (let index = anchorIndex - 1; index >= 0; index -= 1) {
    const currentCardId = columnCards[index]!.cardId;
    const nextCardId = columnCards[index + 1]!.cardId;
    const currentHeight = heightForCardId(currentCardId);
    const nextHeight = heightForCardId(nextCardId);
    const nextCenter = yByCard.get(nextCardId) ?? 0;

    yByCard.set(
      currentCardId,
      nextCenter - nextHeight / 2 - spacing - currentHeight / 2,
    );
  }

  for (let index = anchorIndex + 1; index < columnCards.length; index += 1) {
    const currentCardId = columnCards[index]!.cardId;
    const previousCardId = columnCards[index - 1]!.cardId;
    const currentHeight = heightForCardId(currentCardId);
    const previousHeight = heightForCardId(previousCardId);
    const previousCenter = yByCard.get(previousCardId) ?? 0;

    yByCard.set(
      currentCardId,
      previousCenter + previousHeight / 2 + spacing + currentHeight / 2,
    );
  }

  columnCards.forEach((columnCard) => {
    if (columnCard.cardId === anchorCardId) {
      return;
    }

    const previousCenter = previousYByCard.get(columnCard.cardId) ?? 0;
    const nextCenter = yByCard.get(columnCard.cardId) ?? previousCenter;
    const delta = nextCenter - previousCenter;

    if (delta === 0) {
      return;
    }

    descendantIdsOfCard(cards, columnCard.cardId).forEach((descendantId) => {
      yByCard.set(descendantId, (yByCard.get(descendantId) ?? 0) + delta);
    });
  });
}

function applyColumnCentersAndShiftDescendants(
  cards: CardRecord[],
  columnCards: SpatialCardPosition[],
  nextCenters: Map<string, number>,
  yByCard: Map<string, number>,
) {
  const previousCenters = new Map(yByCard);

  columnCards.forEach((columnCard) => {
    const nextCenter = nextCenters.get(columnCard.cardId);

    if (nextCenter !== undefined) {
      yByCard.set(columnCard.cardId, nextCenter);
    }
  });

  columnCards.forEach((columnCard) => {
    const previousCenter = previousCenters.get(columnCard.cardId) ?? 0;
    const nextCenter = yByCard.get(columnCard.cardId) ?? previousCenter;
    const delta = nextCenter - previousCenter;

    if (delta === 0) {
      return;
    }

    descendantIdsOfCard(cards, columnCard.cardId).forEach((descendantId) => {
      yByCard.set(descendantId, (yByCard.get(descendantId) ?? 0) + delta);
    });
  });
}

export function stageLayout(
  cards: CardRecord[],
  activeCardId: string,
  options: StageLayoutOptions,
) {
  const positions = treeLayout(cards);
  const activePosition = positions.find((position) => position.cardId === activeCardId);
  const activeCard = cards.find((card) => card.id === activeCardId);

  if (!activePosition || !activeCard) {
    return [];
  }

  const columnWidth = options.cardWidth + options.spacing;
  const positionsById = new Map(positions.map((position) => [position.cardId, position]));
  const cardsByColumn = new Map<number, SpatialCardPosition[]>();
  const heightForCardId = (cardId: string) =>
    options.cardHeights?.[cardId] ??
    (cardId === activeCardId
      ? options.activeCardHeight ?? options.cardHeight
      : options.cardHeight);

  positions.forEach((position) => {
    const columnCards = cardsByColumn.get(position.column) ?? [];
    columnCards.push(position);
    cardsByColumn.set(position.column, columnCards);
  });

  cardsByColumn.forEach((columnCards) => {
    columnCards.sort(
      (left, right) =>
        left.row - right.row || left.cardId.localeCompare(right.cardId),
    );
  });

  const yByCard = new Map<string, number>();
  const rootColumnCards = cardsByColumn.get(0) ?? [];
  const rootDesiredCenters = new Map<string, number>();
  const rootGroupHeight = rootColumnCards.reduce(
    (sum, card, index) =>
      sum +
      heightForCardId(card.cardId) +
      (index > 0 ? options.spacing : 0),
    0,
  );
  let rootCursor = -rootGroupHeight / 2;

  rootColumnCards.forEach((card) => {
    const height = heightForCardId(card.cardId);
    rootDesiredCenters.set(card.cardId, rootCursor + height / 2);
    rootCursor += height + options.spacing;
  });

  packColumn(
    rootColumnCards,
    rootDesiredCenters,
    options.spacing,
    heightForCardId,
  ).forEach((value, key) => yByCard.set(key, value));

  const maxColumn = Math.max(...positions.map((position) => position.column));

  for (let column = 1; column <= maxColumn; column += 1) {
    const columnCards = cardsByColumn.get(column) ?? [];
    const parentColumnCards = cardsByColumn.get(column - 1) ?? [];
    const desiredCenters = new Map<string, number>();

    parentColumnCards.forEach((parentPosition) => {
      const parentY = yByCard.get(parentPosition.cardId);

      if (parentY === undefined) {
        return;
      }

      const childCards = sortedChildren(cards, parentPosition.cardId).filter(
        (child) => positionsById.get(child.id)?.column === column,
      );

      if (childCards.length === 0) {
        return;
      }

      const groupHeight = childCards.reduce(
        (sum, child, index) =>
          sum +
          heightForCardId(child.id) +
          (index > 0 ? options.spacing : 0),
        0,
      );
      let cursor = parentY - groupHeight / 2;

      childCards.forEach((child) => {
        const height = heightForCardId(child.id);
        desiredCenters.set(child.id, cursor + height / 2);
        cursor += height + options.spacing;
      });
    });

    packColumn(
      columnCards,
      desiredCenters,
      options.spacing,
      heightForCardId,
    ).forEach((value, key) => yByCard.set(key, value));
  }

  const activeCenterY = yByCard.get(activeCardId) ?? 0;
  yByCard.forEach((value, key) => {
    yByCard.set(key, value - activeCenterY);
  });

  const anchoredCardIds = new Set([
    activeCardId,
    ...ancestorsOfCard(cards, activeCardId).map((ancestor) => ancestor.id),
  ]);

  for (let column = 0; column <= maxColumn; column += 1) {
    const columnCards = cardsByColumn.get(column) ?? [];
    const desiredCenters = new Map<string, number>();

    if (column === 0) {
      columnCards.forEach((card) => {
        desiredCenters.set(card.cardId, yByCard.get(card.cardId) ?? 0);
      });
    } else {
      const parentColumnCards = cardsByColumn.get(column - 1) ?? [];

      parentColumnCards.forEach((parentPosition) => {
        const parentY = yByCard.get(parentPosition.cardId);

        if (parentY === undefined) {
          return;
        }

        const childCards = sortedChildren(cards, parentPosition.cardId).filter(
          (child) => positionsById.get(child.id)?.column === column,
        );

        if (childCards.length === 0) {
          return;
        }

        const groupHeight = childCards.reduce(
          (sum, child, index) =>
            sum +
            heightForCardId(child.id) +
            (index > 0 ? options.spacing : 0),
          0,
        );
        let cursor = parentY - groupHeight / 2;

        childCards.forEach((child) => {
          const height = heightForCardId(child.id);
          desiredCenters.set(child.id, cursor + height / 2);
          cursor += height + options.spacing;
        });
      });
    }

    columnCards.forEach((card) => {
      if (anchoredCardIds.has(card.cardId)) {
        desiredCenters.set(card.cardId, 0);
      }
    });

    packColumn(
      columnCards,
      desiredCenters,
      options.spacing,
      heightForCardId,
    ).forEach((value, key) => yByCard.set(key, value));
  }

  ancestorsOfCard(cards, activeCardId).forEach((ancestor) => {
    const ancestorPosition = positionsById.get(ancestor.id);

    if (!ancestorPosition) {
      return;
    }

    repackColumnAroundAnchor(
      cards,
      cardsByColumn.get(ancestorPosition.column) ?? [],
      ancestor.id,
      options.spacing,
      heightForCardId,
      yByCard,
    );
  });

  const activeColumnCards = cardsByColumn.get(activePosition.column) ?? [];
  repackColumnAroundAnchor(
    cards,
    activeColumnCards,
    activeCardId,
    options.spacing,
    heightForCardId,
    yByCard,
  );

  const activeChildColumnCards = cardsByColumn.get(activePosition.column + 1) ?? [];
  const activeChildren = sortedChildren(cards, activeCardId).filter(
    (child) => positionsById.get(child.id)?.column === activePosition.column + 1,
  );

  if (activeChildren.length > 0 && activeChildColumnCards.length > 0) {
    const activeChildIds = new Set(activeChildren.map((child) => child.id));
    const firstActiveChildIndex = activeChildColumnCards.findIndex((card) =>
      activeChildIds.has(card.cardId),
    );
    const lastActiveChildIndex = activeChildColumnCards.reduce(
      (lastIndex, card, index) =>
        activeChildIds.has(card.cardId) ? index : lastIndex,
      -1,
    );

    if (firstActiveChildIndex !== -1 && lastActiveChildIndex !== -1) {
      const nextCenters = new Map<string, number>();
      const firstActiveChild = activeChildren[0]!;
      nextCenters.set(firstActiveChild.id, 0);

      for (let index = 1; index < activeChildren.length; index += 1) {
        const currentChild = activeChildren[index]!;
        const previousChild = activeChildren[index - 1]!;
        const currentHeight = heightForCardId(currentChild.id);
        const previousHeight = heightForCardId(previousChild.id);
        const previousCenter = nextCenters.get(previousChild.id) ?? 0;

        nextCenters.set(
          currentChild.id,
          previousCenter +
            previousHeight / 2 +
            options.spacing +
            currentHeight / 2,
        );
      }

      for (let index = firstActiveChildIndex - 1; index >= 0; index -= 1) {
        const currentCardId = activeChildColumnCards[index]!.cardId;
        const nextCardId = activeChildColumnCards[index + 1]!.cardId;
        const currentHeight = heightForCardId(currentCardId);
        const nextHeight = heightForCardId(nextCardId);
        const nextCenter = nextCenters.get(nextCardId) ?? 0;

        nextCenters.set(
          currentCardId,
          nextCenter - nextHeight / 2 - options.spacing - currentHeight / 2,
        );
      }

      for (
        let index = lastActiveChildIndex + 1;
        index < activeChildColumnCards.length;
        index += 1
      ) {
        const currentCardId = activeChildColumnCards[index]!.cardId;
        const previousCardId = activeChildColumnCards[index - 1]!.cardId;
        const currentHeight = heightForCardId(currentCardId);
        const previousHeight = heightForCardId(previousCardId);
        const previousCenter = nextCenters.get(previousCardId) ?? 0;

        nextCenters.set(
          currentCardId,
          previousCenter +
            previousHeight / 2 +
            options.spacing +
            currentHeight / 2,
        );
      }

      applyColumnCentersAndShiftDescendants(
        cards,
        activeChildColumnCards,
        nextCenters,
        yByCard,
      );
    }
  }

  const siblingIds = new Set(
    cards
      .filter((card) => card.parentId === activeCard.parentId)
      .map((card) => card.id),
  );
  const childIds = new Set(
    cards.filter((card) => card.parentId === activeCardId).map((card) => card.id),
  );

  return positions.map((position) => ({
    cardId: position.cardId,
    height: heightForCardId(position.cardId),
    isActive: position.cardId === activeCardId,
    isNeighborhood:
      position.cardId === activeCardId ||
      position.cardId === activeCard.parentId ||
      siblingIds.has(position.cardId) ||
      childIds.has(position.cardId),
    x: (position.column - activePosition.column) * columnWidth,
    y: yByCard.get(position.cardId) ?? 0,
  }));
}

function verticalNeighbor(
  cards: CardRecord[],
  cardId: string,
  direction: -1 | 1,
) {
  const positions = treeLayout(cards);
  const current = positions.find((position) => position.cardId === cardId);

  if (!current) {
    return null;
  }

  const columnCards = positions
    .filter((position) => position.column === current.column)
    .sort(
      (left, right) =>
        left.row - right.row || left.cardId.localeCompare(right.cardId),
    );
  const currentIndex = columnCards.findIndex(
    (position) => position.cardId === cardId,
  );
  const nextIndex = currentIndex + direction;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= columnCards.length) {
    return null;
  }

  return columnCards[nextIndex]?.cardId ?? null;
}

export function previousCardInColumn(cards: CardRecord[], cardId: string) {
  return verticalNeighbor(cards, cardId, -1);
}

export function nextCardInColumn(cards: CardRecord[], cardId: string) {
  return verticalNeighbor(cards, cardId, 1);
}
