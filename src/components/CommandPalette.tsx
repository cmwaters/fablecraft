import { useEffect, useRef, useState } from "react";
import { OverlayShell } from "./OverlayShell";

export interface CommandPaletteItem {
  id: string;
  keywords?: string[];
  label: string;
  run: () => void;
}

interface CommandPaletteProps {
  commands: CommandPaletteItem[];
  onClose: () => void;
}

function commandMatchesQuery(command: CommandPaletteItem, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    command.label,
    ...(command.keywords ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase();

  return haystack.includes(normalizedQuery);
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const filteredCommands = commands
    .filter((command) => commandMatchesQuery(command, query))
    .slice(0, 5);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex((currentIndex) => {
      if (filteredCommands.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, filteredCommands.length - 1);
    });
  }, [filteredCommands.length]);

  return (
    <OverlayShell
      onBackdropMouseDown={onClose}
      widthClassName="max-w-[min(92vw,620px)]"
    >
      <div
        className="flex flex-col gap-4"
        onMouseDown={(event) => {
          if (event.target instanceof HTMLInputElement) {
            return;
          }

          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
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
                filteredCommands.length === 0
                  ? 0
                  : (currentIndex + 1) % filteredCommands.length,
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((currentIndex) =>
                filteredCommands.length === 0
                  ? 0
                  : (currentIndex - 1 + filteredCommands.length) %
                    filteredCommands.length,
              );
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              filteredCommands[activeIndex]?.run();
            }
          }}
          placeholder="Type a command"
          ref={inputRef}
          value={query}
        />

        <div className="flex max-h-[52vh] flex-col gap-2 overflow-auto">
          {filteredCommands.length === 0 ? (
            <p className="px-4 py-5 text-sm text-[var(--fc-color-muted)]">
              No commands match “{query.trim()}”.
            </p>
          ) : (
            filteredCommands.map((command, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  className="px-4 py-3 text-left transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                  key={command.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={command.run}
                  style={{
                    backgroundColor: isActive
                      ? "var(--fc-color-surface-strong)"
                      : "var(--fc-color-surface)",
                    boxShadow: isActive ? "var(--fc-shadow-soft)" : "none",
                  }}
                  type="button"
                >
                  <p className="font-[var(--fc-font-ui)] text-base text-[var(--fc-color-text)]">
                    {command.label}
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
