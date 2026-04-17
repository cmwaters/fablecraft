import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { promptForNewDocument, promptForOpenDocument } from "../app/documentActions";
import { importMarkdownDocument } from "../app/importExportActions";
import { rememberLastDocumentPath } from "../storage/lastDocument";
import { fileStem } from "../storage/filePaths";
import { useAppStore } from "../state/appStore";

interface StartupPanelProps {
  onOpenGettingStarted?: (() => void) | null;
  onOpenRecentDocument?: ((path: string) => void) | null;
  onRecentDocumentsChange?: ((paths: string[]) => void) | null;
  recentDocumentPaths?: string[];
}

type StartupView = "main" | "recent";

type StartupRow = {
  key: string;
  label: string;
  muted?: boolean;
  onSelect: () => void;
};

function StartupMenuRow({
  active,
  buttonRef,
  label,
  muted = false,
  onClick,
  onFocus,
  onKeyDown,
}: {
  active: boolean;
  buttonRef: (element: HTMLButtonElement | null) => void;
  label: string;
  muted?: boolean;
  onClick: () => void;
  onFocus: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className="group flex w-full items-center gap-2 bg-[var(--fc-color-surface-strong)] px-5 py-4 text-left shadow-[var(--fc-shadow-soft)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:shadow-[var(--fc-shadow-elevated)] focus-visible:shadow-[var(--fc-shadow-elevated)]"
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      ref={buttonRef}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`inline-flex w-3 justify-center font-[var(--fc-font-ui)] text-xs font-semibold text-[var(--fc-color-text)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        &gt;
      </span>
      <span
        className={`font-[var(--fc-font-ui)] text-[length:var(--fc-content-size)] leading-[1.3] ${
          muted ? "text-[var(--fc-color-muted)]" : "text-[var(--fc-color-text)]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function StartupPanel({
  onOpenGettingStarted = null,
  onOpenRecentDocument = null,
  onRecentDocumentsChange = null,
  recentDocumentPaths = [],
}: StartupPanelProps) {
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [view, setView] = useState<StartupView>("main");
  const [selectedMainIndex, setSelectedMainIndex] = useState(0);
  const [selectedRecentIndex, setSelectedRecentIndex] = useState(0);
  const setDocument = useAppStore((state) => state.setDocument);
  const setMode = useAppStore((state) => state.setMode);
  const setNotice = useAppStore((state) => state.setNotice);

  async function handleNewDocument() {
    const document = await promptForNewDocument();

    if (!document) {
      return;
    }

    onRecentDocumentsChange?.(rememberLastDocumentPath(document.path));
    setDocument(document);
    setMode("editing");
  }

  async function handleOpenDocument() {
    const document = await promptForOpenDocument();

    if (!document) {
      return;
    }

    onRecentDocumentsChange?.(rememberLastDocumentPath(document.path));
    setDocument(document);
  }

  async function handleImport() {
    try {
      const document = await importMarkdownDocument();

      if (!document) {
        return;
      }

      onRecentDocumentsChange?.(rememberLastDocumentPath(document.path));
      setDocument(document);
      setNotice({
        tone: "info",
        message: `Imported Markdown into "${document.name}".`,
      });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Fablecraft could not import that Markdown file.";

      setNotice({
        tone: "error",
        message,
      });
    }
  }

  const mainRows = useMemo<StartupRow[]>(() => {
    const rows: StartupRow[] = [];

    if (onOpenRecentDocument && recentDocumentPaths.length > 0) {
      rows.push({
        key: "open-recent",
        label: "Open Recent",
        onSelect: () => {
          setSelectedRecentIndex(0);
          setView("recent");
        },
      });
    }

    rows.push(
      {
        key: "new-document",
        label: "New Document",
        onSelect: () => void handleNewDocument(),
      },
      {
        key: "open-document",
        label: "Open Document",
        onSelect: () => void handleOpenDocument(),
      },
      {
        key: "import-markdown",
        label: "Import Markdown",
        onSelect: () => void handleImport(),
      },
    );

    if (onOpenGettingStarted) {
      rows.push({
        key: "getting-started",
        label: "Getting Started",
        onSelect: onOpenGettingStarted,
      });
    }

    return rows;
  }, [onOpenGettingStarted, onOpenRecentDocument, recentDocumentPaths]);

  const recentRows = useMemo<StartupRow[]>(() => {
    const rows: StartupRow[] = recentDocumentPaths.slice(0, 5).map((path) => ({
      key: path,
      label: fileStem(path),
      onSelect: () => {
        onOpenRecentDocument?.(path);
      },
    }));

    rows.push({
      key: "back",
      label: "Back",
      muted: true,
      onSelect: () => {
        setView("main");
      },
    });

    return rows;
  }, [onOpenRecentDocument, recentDocumentPaths]);

  const rows = view === "recent" ? recentRows : mainRows;
  const selectedIndex = view === "recent" ? selectedRecentIndex : selectedMainIndex;

  useEffect(() => {
    if (view === "main" && selectedMainIndex >= mainRows.length) {
      setSelectedMainIndex(Math.max(0, mainRows.length - 1));
    }
  }, [mainRows.length, selectedMainIndex, view]);

  useEffect(() => {
    if (view === "recent" && selectedRecentIndex >= recentRows.length) {
      setSelectedRecentIndex(Math.max(0, recentRows.length - 1));
    }
  }, [recentRows.length, selectedRecentIndex, view]);

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, rows.length);
    const activeRow = rowRefs.current[selectedIndex] ?? rowRefs.current[0];

    if (!activeRow) {
      return;
    }

    const tryFocus = () => {
      activeRow.focus();
    };

    // Also listen for window focus in case the OS hasn't focused the window yet
    // (common on initial app launch in Tauri/desktop environments)
    window.addEventListener("focus", tryFocus, { once: true });
    const frame = window.requestAnimationFrame(tryFocus);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("focus", tryFocus);
    };
  }, [rows, selectedIndex]);

  function setCurrentIndex(index: number) {
    if (view === "recent") {
      setSelectedRecentIndex(index);
      return;
    }

    setSelectedMainIndex(index);
  }

  function moveSelection(direction: -1 | 1) {
    const nextIndex = (selectedIndex + direction + rows.length) % rows.length;
    setCurrentIndex(nextIndex);
  }

  function closeRecentView() {
    setView("main");
  }

  function handleRowKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if ((event.key === "Escape" || event.key === "Backspace") && view === "recent") {
      event.preventDefault();
      closeRecentView();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      rows[index]?.onSelect();
    }
  }

  const eyebrow =
    view === "recent" ? "Previously Visited .fable Files" : "The Writers Tool for Structured Thought.";

  return (
    <section className="w-full max-w-[var(--fc-card-width)] bg-[var(--fc-color-surface)] p-10 shadow-[var(--fc-shadow-card)]">
      <div className="flex flex-col gap-4">
        <h1 className="font-[var(--fc-font-ui)] text-[clamp(4.4rem,11vw,6.6rem)] font-medium leading-[0.86] tracking-[-0.075em] text-[var(--fc-color-text)]">
          fablecraft
        </h1>
        <div className="h-px w-full bg-[color:rgba(23,20,18,0.12)]" />
        <p className="max-w-[34ch] whitespace-pre-line font-[var(--fc-font-ui)] text-sm font-normal tracking-normal text-[var(--fc-color-muted)]">
          {eyebrow}
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {rows.map((row, index) => (
          <StartupMenuRow
            active={selectedIndex === index}
            buttonRef={(element) => {
              rowRefs.current[index] = element;
            }}
            key={row.key}
            label={row.label}
            muted={row.muted}
            onClick={row.onSelect}
            onFocus={() => {
              setCurrentIndex(index);
            }}
            onKeyDown={(event) => {
              handleRowKeyDown(event, index);
            }}
          />
        ))}
      </div>
    </section>
  );
}
