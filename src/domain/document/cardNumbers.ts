import type { CardRecord, DocumentSnapshot } from "./types";

function sortedChildren(cards: CardRecord[], parentId: string | null) {
  return cards
    .filter((card) => card.parentId === parentId)
    .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id));
}

function depthLetter(depth: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (depth < alphabet.length) {
    return alphabet[depth];
  }

  return alphabet[alphabet.length - 1];
}

function formatCardIndex(index: number) {
  return String(index).padStart(2, "0");
}

export function buildCardNumberMap(snapshot: DocumentSnapshot) {
  const cardNumbers: Record<string, string> = {};
  const depthCounts = new Map<number, number>();

  function visit(parentId: string | null, depth: number) {
    const children = sortedChildren(snapshot.cards, parentId);

    for (const child of children) {
      const nextIndex = (depthCounts.get(depth) ?? 0) + 1;
      depthCounts.set(depth, nextIndex);
      cardNumbers[child.id] = `${depthLetter(depth)}${formatCardIndex(nextIndex)}`;
      visit(child.id, depth + 1);
    }
  }

  visit(null, 0);

  return cardNumbers;
}
