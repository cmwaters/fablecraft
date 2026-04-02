import { cardContent, contentPreview, contentText } from "./content";
import { buildCardNumberMap } from "./cardNumbers";
import type { DocumentSnapshot } from "./types";

export interface SearchResult {
  cardId: string;
  cardLabel: string;
  excerpt: string;
  matchIndex: number;
}

export function searchDocument(
  snapshot: DocumentSnapshot,
  query: string,
): SearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const cardNumbers = buildCardNumberMap(snapshot);

  return snapshot.cards
    .map((card) => {
      const contentJson = cardContent(snapshot, card.id);
      const plainText = contentText(contentJson);
      const matchIndex = plainText.toLocaleLowerCase().indexOf(normalizedQuery);

      if (matchIndex === -1) {
        return null;
      }

      return {
        cardId: card.id,
        cardLabel: cardNumbers[card.id] ?? card.id.toUpperCase(),
        excerpt: contentPreview(contentJson, 120),
        matchIndex,
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .sort(
      (left, right) =>
        left.matchIndex - right.matchIndex ||
        left.cardLabel.localeCompare(right.cardLabel),
    );
}
