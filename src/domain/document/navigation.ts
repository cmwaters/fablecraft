import type { CardRecord } from "./types";

function sortedChildren(cards: CardRecord[], parentId: string | null) {
  return cards
    .filter((card) => card.parentId === parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
}

function rootCard(cards: CardRecord[]) {
  return cards.find((card) => card.parentId === null) ?? null;
}

export function visibleCardIds(cards: CardRecord[]) {
  const root = rootCard(cards);

  if (!root) {
    return [];
  }

  const orderedIds: string[] = [];
  const stack = [root.id];

  while (stack.length > 0) {
    const currentCardId = stack.pop()!;
    orderedIds.push(currentCardId);

    const children = sortedChildren(cards, currentCardId);

    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push(children[index]!.id);
    }
  }

  return orderedIds;
}

export function parentCardId(cards: CardRecord[], cardId: string) {
  return cards.find((card) => card.id === cardId)?.parentId ?? null;
}

export function firstChildCardId(cards: CardRecord[], cardId: string) {
  return sortedChildren(cards, cardId)[0]?.id ?? null;
}

export function previousSiblingCardId(cards: CardRecord[], cardId: string) {
  const currentCard = cards.find((card) => card.id === cardId);

  if (!currentCard) {
    return null;
  }

  const siblings = sortedChildren(cards, currentCard.parentId);
  const index = siblings.findIndex((card) => card.id === cardId);

  if (index <= 0) {
    return null;
  }

  return siblings[index - 1]?.id ?? null;
}

export function nextSiblingCardId(cards: CardRecord[], cardId: string) {
  const currentCard = cards.find((card) => card.id === cardId);

  if (!currentCard) {
    return null;
  }

  const siblings = sortedChildren(cards, currentCard.parentId);
  const index = siblings.findIndex((card) => card.id === cardId);

  if (index === -1 || index >= siblings.length - 1) {
    return null;
  }

  return siblings[index + 1]?.id ?? null;
}

export function previousVisibleCardId(cards: CardRecord[], cardId: string) {
  const orderedIds = visibleCardIds(cards);
  const index = orderedIds.indexOf(cardId);

  if (index <= 0) {
    return null;
  }

  return orderedIds[index - 1] ?? null;
}

export function nextVisibleCardId(cards: CardRecord[], cardId: string) {
  const orderedIds = visibleCardIds(cards);
  const index = orderedIds.indexOf(cardId);

  if (index === -1 || index >= orderedIds.length - 1) {
    return null;
  }

  return orderedIds[index + 1] ?? null;
}
