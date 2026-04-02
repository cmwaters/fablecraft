import { useEffect, useRef, useState } from "react";
import { searchDocument } from "../domain/document/search";
import { OverlayShell } from "./OverlayShell";
import type { DocumentSnapshot } from "../domain/document/types";

interface SearchOverlayProps {
  onClose: () => void;
  onJump: (cardId: string) => void;
  snapshot: DocumentSnapshot;
}

export function SearchOverlay({
  onClose,
  onJump,
  snapshot,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = searchDocument(snapshot, query);

  useEffect(() => {
    setQuery("");
    setActiveIndex(0);
  }, [snapshot.summary.documentId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex((currentIndex) => {
      if (results.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, results.length - 1);
    });
  }, [results.length]);

  function handleSubmit(cardId: string | null) {
    if (!cardId) {
      return;
    }

    onJump(cardId);
  }

  return (
    <OverlayShell
      onBackdropMouseDown={onClose}
      widthClassName="max-w-[min(92vw,680px)]"
    >
      <div className="flex flex-col gap-4">
        <input
          className="w-full bg-[var(--fc-color-surface-strong)] px-4 py-3 font-[var(--fc-font-ui)] text-base text-[var(--fc-color-text)] shadow-[var(--fc-shadow-soft)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((currentIndex) =>
                results.length === 0 ? 0 : (currentIndex + 1) % results.length,
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((currentIndex) =>
                results.length === 0
                  ? 0
                  : (currentIndex - 1 + results.length) % results.length,
              );
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit(results[activeIndex]?.cardId ?? null);
            }
          }}
          placeholder="Search this document"
          ref={inputRef}
          value={query}
        />

        <div className="flex max-h-[50vh] flex-col gap-2 overflow-auto">
          {query.trim().length === 0 ? (
            <p className="px-4 py-5 text-sm text-[var(--fc-color-muted)]">
              Type to search card content. Use the arrow keys to move through the results, then press Enter to jump.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-5 text-sm text-[var(--fc-color-muted)]">
              No cards in this document match “{query.trim()}”.
            </p>
          ) : (
            results.map((result, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  className="px-4 py-3 text-left transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                  key={result.cardId}
                  onClick={() => handleSubmit(result.cardId)}
                  style={{
                    backgroundColor: isActive
                      ? "var(--fc-color-surface-strong)"
                      : "var(--fc-color-surface)",
                    boxShadow: isActive ? "var(--fc-shadow-soft)" : "none",
                  }}
                  type="button"
                >
                  <p className="font-[var(--fc-font-ui)] text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fc-color-muted)]">
                    Card {result.cardLabel}
                  </p>
                  <p className="mt-2 font-[var(--fc-font-content)] text-[length:var(--fc-content-size)] leading-[var(--fc-content-line-height)] text-[var(--fc-color-text)]">
                    {result.excerpt}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </OverlayShell>
  );
}
