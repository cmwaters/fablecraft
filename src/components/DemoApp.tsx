import { useEffect, useState } from "react";
import { CommandPalette, type CommandPaletteItem } from "./CommandPalette";
import { DocumentWorkspace } from "./DocumentWorkspace";
import { HelpSheet } from "./HelpSheet";
import { SearchOverlay } from "./SearchOverlay";
import { SettingsDialog } from "./SettingsDialog";
import { useAppStore, type AppMode } from "../state/appStore";
import { useDocumentStore } from "../state/documentStore";
import { useInteractionStore } from "../state/interactionStore";
import { WEBSITE_TUTORIAL_SNAPSHOT } from "../site/tutorialSnapshot";

const DEMO_SNAPSHOT = WEBSITE_TUTORIAL_SNAPSHOT;
const DEMO_SUMMARY = DEMO_SNAPSHOT.summary;
const DEMO_DOC_ID = DEMO_SUMMARY.documentId;

// Pre-load demo snapshot into the store when this module is first imported.
// DemoApp is lazy-loaded so this runs just before the first render.
useDocumentStore.getState().hydrateSnapshot(DEMO_SNAPSHOT);

type HelpSheetMode = "commands" | "getting-started" | "shortcuts";
type OverlayReturnMode = Exclude<AppMode, "command" | "search">;

export function DemoApp() {
  const [overlayReturnMode, setOverlayReturnMode] = useState<OverlayReturnMode>("navigation");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [helpSheetMode, setHelpSheetMode] = useState<HelpSheetMode | null>(null);

  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const setDocument = useAppStore((state) => state.setDocument);
  const snapshot = useDocumentStore((state) => state.snapshot);
  const setActiveCardId = useInteractionStore((state) => state.setActiveCardId);

  useEffect(() => {
    setDocument(DEMO_SUMMARY);
  }, [setDocument]);

  const activeSnapshot =
    snapshot?.summary.documentId === DEMO_DOC_ID ? snapshot : null;

  function restoreOverlayMode() {
    setMode(overlayReturnMode);
  }

  function closeAuxiliaryOverlays() {
    setSettingsOpen(false);
    setHelpSheetMode(null);
  }

  function openCommandPalette() {
    if (mode === "command") {
      restoreOverlayMode();
      return;
    }
    closeAuxiliaryOverlays();
    setOverlayReturnMode(mode === "editing" ? "editing" : "navigation");
    setMode("command");
  }

  function openSearchOverlay() {
    if (!activeSnapshot) return;
    closeAuxiliaryOverlays();
    setOverlayReturnMode(mode === "editing" ? "editing" : "navigation");
    setMode("search");
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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
      if (event.key === "Escape" && (isSettingsOpen || helpSheetMode)) {
        event.preventDefault();
        closeAuxiliaryOverlays();
        restoreOverlayMode();
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  });

  const commandItems: CommandPaletteItem[] = [
    {
      id: "getting-started",
      keywords: ["first time", "guide", "intro", "help"],
      label: "Getting Started",
      run: () => {
        closeAuxiliaryOverlays();
        setMode("navigation");
        setHelpSheetMode("getting-started");
      },
    },
    {
      id: "show-shortcuts",
      keywords: ["keys", "keyboard"],
      label: "Show Shortcuts",
      run: () => {
        closeAuxiliaryOverlays();
        setMode("navigation");
        setHelpSheetMode("shortcuts");
      },
    },
    {
      id: "open-settings",
      keywords: ["theme", "font", "appearance"],
      label: "Settings",
      run: () => {
        closeAuxiliaryOverlays();
        setMode("navigation");
        setSettingsOpen(true);
      },
    },
    {
      id: "show-commands",
      keywords: ["commands", "palette"],
      label: "Show Command List",
      run: () => {
        closeAuxiliaryOverlays();
        setMode("navigation");
        setHelpSheetMode("commands");
      },
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--fc-color-app)] text-[var(--fc-color-text)] antialiased">
      <div className="flex min-h-0 flex-1 items-stretch">
        <DocumentWorkspace
          disableScrollPan
          document={DEMO_SUMMARY}
          suspendKeyboard={Boolean(isSettingsOpen || helpSheetMode)}
        />
      </div>

      {mode === "command" && (
        <CommandPalette commands={commandItems} onClose={restoreOverlayMode} />
      )}

      {mode === "search" && activeSnapshot && (
        <SearchOverlay
          onClose={restoreOverlayMode}
          onJump={(cardId) => {
            setActiveCardId(cardId);
            setMode("navigation");
          }}
          snapshot={activeSnapshot}
        />
      )}

      {isSettingsOpen && (
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
            restoreOverlayMode();
          }}
        />
      )}
    </div>
  );
}
