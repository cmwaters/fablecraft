import { useEffect, useState } from "react";
import { promptForNewDocument, promptForOpenDocument } from "./documentActions";
import { exportCurrentLevelToFile, importMarkdownDocument } from "./importExportActions";
import { CommandPalette, type CommandPaletteItem } from "../components/CommandPalette";
import { DocumentWorkspace } from "../components/DocumentWorkspace";
import { HelpSheet } from "../components/HelpSheet";
import { SearchOverlay } from "../components/SearchOverlay";
import { SettingsDialog } from "../components/SettingsDialog";
import { StartupPanel } from "../components/StartupPanel";
import { mergeCardWithNextSibling, mergeCardWithPreviousSibling } from "../domain/document/tree";
import {
  dispatchNativeMenuAction,
  listenForNativeMenuActions,
  type NativeMenuAction,
} from "../lib/nativeMenu";
import { syncNativeWindowAppearance } from "../lib/nativeWindowAppearance";
import {
  clearLastDocumentPath,
  forgetRecentDocumentPath,
  readRecentDocumentPaths,
  rememberLastDocumentPath,
} from "../storage/lastDocument";
import { openDocumentAtPath } from "../storage/documents";
import {
  enableClaudeDesktopIntegration,
  enableCodexIntegration,
  loadLocalIntegrationStatuses,
  type LocalIntegrationStatuses,
} from "../storage/integrations";
import { useAppStore, type AppMode } from "../state/appStore";
import { useDocumentStore } from "../state/documentStore";
import { useInteractionStore } from "../state/interactionStore";
import { useSettingsStore } from "../state/settingsStore";

type OverlayReturnMode = Exclude<AppMode, "command" | "search">;
type HelpSheetMode = "commands" | "getting-started" | "shortcuts";

function noticeMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

const defaultIntegrationStatuses: LocalIntegrationStatuses = {
  claudeDesktop: {
    binaryExists: false,
    binaryPath: null,
    configPath: "",
    enabled: false,
  },
  codex: {
    binaryExists: false,
    binaryPath: null,
    configPath: "",
    enabled: false,
  },
};

export function App() {
  const [overlayReturnMode, setOverlayReturnMode] =
    useState<OverlayReturnMode>("navigation");
  const [integrationStatuses, setIntegrationStatuses] =
    useState<LocalIntegrationStatuses>(defaultIntegrationStatuses);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [helpSheetMode, setHelpSheetMode] = useState<HelpSheetMode | null>(null);
  const [recentDocumentPaths, setRecentDocumentPaths] = useState<string[]>([]);
  const activeDocument = useAppStore((state) => state.activeDocument);
  const mode = useAppStore((state) => state.mode);
  const notice = useAppStore((state) => state.notice);
  const screen = useAppStore((state) => state.screen);
  const setDocument = useAppStore((state) => state.setDocument);
  const setMode = useAppStore((state) => state.setMode);
  const setNotice = useAppStore((state) => state.setNotice);
  const setScreen = useAppStore((state) => state.setScreen);
  const theme = useSettingsStore((state) => state.preferences.theme);
  const snapshot = useDocumentStore((state) => state.snapshot);
  const applyNavigationChange = useDocumentStore(
    (state) => state.applyNavigationChange,
  );
  const activeCardId = useInteractionStore((state) => state.activeCardId);
  const setActiveCardId = useInteractionStore((state) => state.setActiveCardId);
  const activeSnapshot =
    activeDocument && snapshot?.summary.documentId === activeDocument.documentId
      ? snapshot
      : null;
  const selectedCard =
    activeSnapshot?.cards.find((card) => card.id === activeCardId) ?? null;
  const selectedSiblingGroup = selectedCard
    ? (activeSnapshot?.cards
        .filter((card) => card.parentId === selectedCard.parentId)
        .sort((left, right) => left.orderIndex - right.orderIndex || left.id.localeCompare(right.id)) ??
      [])
    : [];
  const selectedSiblingIndex = selectedCard
    ? selectedSiblingGroup.findIndex((card) => card.id === selectedCard.id)
    : -1;
  const canMergeWithAbove = selectedSiblingIndex > 0;
  const canMergeWithBelow =
    selectedSiblingIndex !== -1 &&
    selectedSiblingIndex < selectedSiblingGroup.length - 1;

  async function refreshIntegrationStatuses() {
    try {
      setIntegrationStatuses(await loadLocalIntegrationStatuses());
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void syncNativeWindowAppearance(theme);
  }, [theme]);

  useEffect(() => {
    setRecentDocumentPaths(readRecentDocumentPaths());
    setScreen("startup");
  }, [setScreen]);

  useEffect(() => {
    if (screen !== "workspace") {
      return;
    }

    void refreshIntegrationStatuses();
  }, [screen, mode]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 5200 : 3200,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice, setNotice]);

  function restoreOverlayMode() {
    setMode(overlayReturnMode);
  }

  function closeAuxiliaryOverlays() {
    setSettingsOpen(false);
    setHelpSheetMode(null);
  }

  function openCommandPalette() {
    if (screen !== "workspace") {
      return;
    }

    if (mode === "command") {
      restoreOverlayMode();
      return;
    }

    closeAuxiliaryOverlays();
    setOverlayReturnMode(mode === "editing" ? "editing" : "navigation");
    setMode("command");
  }

  function openSearchOverlay() {
    if (screen !== "workspace" || !activeSnapshot) {
      return;
    }

    closeAuxiliaryOverlays();
    setOverlayReturnMode(mode === "editing" ? "editing" : "navigation");
    setMode("search");
  }

  function openHelpSheet(modeToOpen: HelpSheetMode) {
    if (screen !== "workspace") {
      return;
    }

    closeAuxiliaryOverlays();
    setOverlayReturnMode(mode === "editing" ? "editing" : "navigation");
    setMode("navigation");
    setHelpSheetMode(modeToOpen);
  }

  function openSettingsDialog() {
    if (screen !== "workspace") {
      return;
    }

    closeAuxiliaryOverlays();
    setOverlayReturnMode(mode === "editing" ? "editing" : "navigation");
    setMode("navigation");
    setSettingsOpen(true);
  }

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (screen !== "workspace") {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        openSearchOverlay();
        return;
      }

      if (
        event.key === "Escape" &&
        (isSettingsOpen || helpSheetMode)
      ) {
        event.preventDefault();
        closeAuxiliaryOverlays();
        restoreOverlayMode();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [
    helpSheetMode,
    isSettingsOpen,
    mode,
    openCommandPalette,
    openSearchOverlay,
    overlayReturnMode,
    screen,
  ]);

  async function handleNewDocument() {
    try {
      const document = await promptForNewDocument();

      if (!document) {
        return;
      }

      setRecentDocumentPaths(rememberLastDocumentPath(document.path));
      setDocument(document);
      setMode("editing");
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: noticeMessage(error, "Fablecraft could not create that document."),
      });
    }
  }

  async function handleOpenDocument() {
    try {
      const document = await promptForOpenDocument();

      if (!document) {
        return;
      }

      setRecentDocumentPaths(rememberLastDocumentPath(document.path));
      setDocument(document);
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: noticeMessage(error, "Fablecraft could not open that document."),
      });
    }
  }

  async function handleOpenRecentDocument(path: string) {
    if (!path) {
      return;
    }

    try {
      const document = await openDocumentAtPath(path);
      setRecentDocumentPaths(rememberLastDocumentPath(document.path));
      setDocument(document);
      setNotice(null);
    } catch (error) {
      const nextRecentDocumentPaths = forgetRecentDocumentPath(path);
      setRecentDocumentPaths(nextRecentDocumentPaths);
      if (nextRecentDocumentPaths.length === 0) {
        clearLastDocumentPath();
      }
      setNotice({
        tone: "error",
        message: noticeMessage(error, "Fablecraft could not reopen that recent document."),
      });
      setScreen("startup");
    }
  }

  async function handleImportMarkdown() {
    try {
      const document = await importMarkdownDocument();

      if (!document) {
        return;
      }

      setRecentDocumentPaths(rememberLastDocumentPath(document.path));
      setDocument(document);
      setNotice({
        tone: "info",
        message: `Imported Markdown into "${document.name}".`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: noticeMessage(error, "Fablecraft could not import that Markdown file."),
      });
    }
  }

  async function handleEnableCodex() {
    try {
      const status = await enableCodexIntegration();
      setIntegrationStatuses((currentStatuses) => ({
        ...currentStatuses,
        codex: status,
      }));
      setNotice({
        tone: "info",
        message: status.enabled
          ? "Codex integration is enabled. Open a new Codex session to pick it up."
          : "Fablecraft could not confirm the Codex integration status.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: noticeMessage(
          error,
          "Fablecraft could not enable the Codex integration.",
        ),
      });
    }
  }

  async function handleEnableClaudeDesktop() {
    try {
      const status = await enableClaudeDesktopIntegration();
      setIntegrationStatuses((currentStatuses) => ({
        ...currentStatuses,
        claudeDesktop: status,
      }));
      setNotice({
        tone: "info",
        message: status.enabled
          ? "Claude Desktop integration is enabled. Restart Claude Desktop and start a new chat."
          : "Fablecraft could not confirm the Claude Desktop integration status.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: noticeMessage(
          error,
          "Fablecraft could not enable the Claude Desktop integration.",
        ),
      });
    }
  }

  function runPaletteAction(action: () => void | Promise<void>) {
    closeAuxiliaryOverlays();
    setMode("navigation");
    void action();
  }

  async function exportLevelFromMenu(format: "markdown" | "html") {
    if (!activeSnapshot || !activeDocument || !activeCardId) {
      return;
    }

    const result = await exportCurrentLevelToFile(
      activeSnapshot,
      activeCardId,
      activeDocument.name,
      format,
    );

    if (!result) {
      return;
    }

    setNotice({
      tone: "info",
      message: `Exported ${result.cardCount} card${result.cardCount === 1 ? "" : "s"} from level ${result.depth} as ${format === "markdown" ? "Markdown" : "HTML"}.`,
    });
  }

  function mergeSelectedCard(direction: "above" | "below") {
    if (!selectedCard) {
      return;
    }

    if (direction === "above" && !canMergeWithAbove) {
      return;
    }

    if (direction === "below" && !canMergeWithBelow) {
      return;
    }

    setMode("navigation");
    applyNavigationChange((snapshotToChange) =>
      direction === "above"
        ? mergeCardWithPreviousSibling(snapshotToChange, selectedCard.id)
        : mergeCardWithNextSibling(snapshotToChange, selectedCard.id),
    );
    setActiveCardId(selectedCard.id);
  }

  function handleNativeMenuAction(action: NativeMenuAction) {
    dispatchNativeMenuAction(action);

    if (action === "new-document") {
      void handleNewDocument();
      return;
    }

    if (action === "open-document") {
      void handleOpenDocument();
      return;
    }

    if (action === "import-markdown") {
      void handleImportMarkdown();
      return;
    }

    if (action === "export-markdown") {
      void exportLevelFromMenu("markdown");
      return;
    }

    if (screen !== "workspace") {
      return;
    }

    if (action === "search") {
      openSearchOverlay();
      return;
    }

    if (action === "command-palette") {
      openCommandPalette();
      return;
    }

    if (action === "settings") {
      openSettingsDialog();
      return;
    }

    if (action === "help-shortcuts") {
      openHelpSheet("shortcuts");
      return;
    }

    if (action === "help-getting-started") {
      openHelpSheet("getting-started");
      return;
    }

    if (action === "help-commands") {
      openHelpSheet("commands");
      return;
    }

    if (action === "enable-codex") {
      void handleEnableCodex();
      return;
    }

    if (action === "enable-claude-desktop") {
      void handleEnableClaudeDesktop();
    }
  }

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let disposed = false;

    async function attachNativeMenuListener() {
      const cleanup = await listenForNativeMenuActions(handleNativeMenuAction);

      if (disposed) {
        cleanup();
        return;
      }

      unlisten = cleanup;
    }

    void attachNativeMenuListener();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [
    activeCardId,
    activeDocument,
    activeSnapshot,
    applyNavigationChange,
    canMergeWithAbove,
    canMergeWithBelow,
    mode,
    openCommandPalette,
    handleEnableClaudeDesktop,
    handleEnableCodex,
    openHelpSheet,
    openSearchOverlay,
    openSettingsDialog,
    screen,
    selectedCard,
  ]);

  const commandItems: CommandPaletteItem[] = [
    {
      id: "getting-started",
      keywords: ["first time", "guide", "intro", "help"],
      label: "Getting Started",
      run: () => {
        openHelpSheet("getting-started");
      },
    },
    {
      id: "help",
      keywords: ["commands", "groups"],
      label: "Show Command List",
      run: () => {
        openHelpSheet("commands");
      },
    },
    {
      id: "open-settings",
      keywords: ["theme", "font", "width", "line height"],
      label: "Settings",
      run: () => {
        openSettingsDialog();
      },
    },
    {
      id: "enable-codex",
      keywords: ["mcp", "integration", "codex"],
      label: `${integrationStatuses.codex.enabled ? "✓ " : ""}Enable Codex`,
      run: () => runPaletteAction(handleEnableCodex),
    },
    {
      id: "enable-claude-desktop",
      keywords: ["mcp", "integration", "claude", "desktop"],
      label: `${integrationStatuses.claudeDesktop.enabled ? "✓ " : ""}Enable Claude Desktop`,
      run: () => runPaletteAction(handleEnableClaudeDesktop),
    },
    {
      id: "new-document",
      keywords: ["create"],
      label: "New Document",
      run: () => runPaletteAction(handleNewDocument),
    },
    {
      id: "open-document",
      keywords: ["reopen"],
      label: "Open Document",
      run: () => runPaletteAction(handleOpenDocument),
    },
    {
      id: "import-markdown",
      keywords: ["md"],
      label: "Import Markdown",
      run: () => runPaletteAction(handleImportMarkdown),
    },
    {
      id: "export-markdown",
      keywords: ["md", "export", "selected level"],
      label: "Export Level as Markdown",
      run: () => runPaletteAction(() => exportLevelFromMenu("markdown")),
    },
    {
      id: "export-html",
      keywords: ["html", "export", "selected level"],
      label: "Export Level as HTML",
      run: () => runPaletteAction(() => exportLevelFromMenu("html")),
    },
    {
      id: "show-shortcuts",
      keywords: ["keys"],
      label: "Show Shortcuts",
      run: () => {
        openHelpSheet("shortcuts");
      },
    },
  ];

  if (activeSnapshot) {
    if (selectedCard && canMergeWithAbove) {
      commandItems.push({
        id: "merge-with-above",
        keywords: ["merge", "join", "combine", "up"],
        label: "Merge with Above",
        run: () => mergeSelectedCard("above"),
      });
    }

    if (selectedCard && canMergeWithBelow) {
      commandItems.push({
        id: "merge-below",
        keywords: ["merge", "join", "combine", "down"],
        label: "Merge Below",
        run: () => mergeSelectedCard("below"),
      });
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[var(--fc-color-app)] text-[var(--fc-color-text)] antialiased">
      <div
        className={
          screen === "workspace"
            ? "flex h-full w-full items-stretch"
            : "mx-auto flex h-full w-full max-w-[1680px] items-center justify-center px-6 py-10"
        }
      >
        {screen === "startup" && (
          <StartupPanel
            onOpenGettingStarted={() => {
              setHelpSheetMode("getting-started");
            }}
            onOpenRecentDocument={(path) => void handleOpenRecentDocument(path)}
            onRecentDocumentsChange={setRecentDocumentPaths}
            recentDocumentPaths={recentDocumentPaths}
          />
        )}

        {screen === "workspace" && activeDocument && (
          <DocumentWorkspace
            document={activeDocument}
            suspendKeyboard={Boolean(
              isSettingsOpen || helpSheetMode,
            )}
          />
        )}
      </div>

      {screen === "workspace" && mode === "command" && (
        <CommandPalette
          commands={commandItems}
          onClose={restoreOverlayMode}
        />
      )}

      {screen === "workspace" && mode === "search" && activeSnapshot && (
        <SearchOverlay
          onClose={restoreOverlayMode}
          onJump={(cardId) => {
            setActiveCardId(cardId);
            setMode("navigation");
          }}
          snapshot={activeSnapshot}
        />
      )}

      {screen === "workspace" && isSettingsOpen && (
        <SettingsDialog
          onClose={() => {
            setSettingsOpen(false);
            restoreOverlayMode();
          }}
        />
      )}

      {helpSheetMode && (
        <HelpSheet
          mode={helpSheetMode}
          onClose={() => {
            setHelpSheetMode(null);
            if (screen === "workspace") {
              restoreOverlayMode();
            }
          }}
        />
      )}

      {notice && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(90vw,720px)] -translate-x-1/2 bg-[var(--fc-color-surface)] px-5 py-3 text-sm text-[var(--fc-color-text)] shadow-[var(--fc-shadow-elevated)]">
          {notice.message}
        </div>
      )}

    </main>
  );
}
