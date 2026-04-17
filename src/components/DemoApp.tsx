import { useEffect, useState } from "react";
import { CommandPalette, type CommandPaletteItem } from "./CommandPalette";
import { DocumentWorkspace } from "./DocumentWorkspace";
import { HelpSheet } from "./HelpSheet";
import { SearchOverlay } from "./SearchOverlay";
import { SettingsDialog } from "./SettingsDialog";
import { useAppStore, type AppMode } from "../state/appStore";
import { useDocumentStore } from "../state/documentStore";
import { useInteractionStore } from "../state/interactionStore";
import type { DocumentSnapshot } from "../domain/document/types";
import type { DocumentSummary } from "../types/document";

const DEMO_DOC_ID = "fablecraft-demo";
const DEMO_LAYER_ID = "demo-layer-draft";

type TipTapNode = Record<string, unknown>;

function text(value: string, marks?: Array<{ type: string }>): TipTapNode {
  return marks ? { type: "text", text: value, marks } : { type: "text", text: value };
}
function bold(value: string): TipTapNode {
  return text(value, [{ type: "bold" }]);
}
function p(...inline: Array<string | TipTapNode>): TipTapNode {
  return {
    type: "paragraph",
    content: inline.map((n) => (typeof n === "string" ? text(n) : n)),
  };
}
function h(level: 1 | 2 | 3, value: string): TipTapNode {
  return {
    type: "heading",
    attrs: { level },
    content: [text(value)],
  };
}
function ul(...items: Array<string | TipTapNode[]>): TipTapNode {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content:
        typeof item === "string"
          ? [{ type: "paragraph", content: [text(item)] }]
          : [{ type: "paragraph", content: item }],
    })),
  };
}
function doc(...nodes: TipTapNode[]): string {
  return JSON.stringify({ type: "doc", content: nodes });
}

const DEMO_SUMMARY: DocumentSummary = {
  documentId: DEMO_DOC_ID,
  layerCount: 1,
  name: "Fablecraft Tour",
  openedAtMs: Date.now(),
  path: "/demo/tour.fable",
};

interface DemoCardSpec {
  id: string;
  parentId: string | null;
  contentJson: string;
}

const DEMO_CARD_SPECS: DemoCardSpec[] = [
  // 5 root cards — each one a persuasive hook into its topic
  {
    id: "nav",
    parentId: null,
    contentJson: doc(
      h(2, "Start messy. Organise later."),
      p(
        "Your best ideas rarely arrive in order. They come mid-shower, mid-walk, mid-sentence. ",
        bold("Fablecraft"),
        " gives you a place to dump them all — then shape them into something coherent without losing the thread.",
      ),
      p(
        "Every thought lives in a card. Cards nest inside cards. What starts as a pile of fragments becomes chapters, scenes, arguments, outlines — whatever structure your work needs.",
      ),
      h(3, "Try it now"),
      ul(
        "Press → to dive into this card's children",
        "Press ↓ to step between siblings",
        "Press ← to rise back up to the parent",
      ),
      p("The whole document is a tree. You move through it like one."),
    ),
  },
  {
    id: "editing",
    parentId: null,
    contentJson: doc(
      h(2, "Write at the speed of thought."),
      p(
        "No menus. No mouse. Just press a letter and you're writing. Press Escape and you're navigating. The boundary between capturing an idea and placing it in your outline disappears.",
      ),
      p(
        "Need a new thought next to this one? ",
        bold("⌘↓"),
        ". Need to break it into sub-points? ",
        bold("⌘→"),
        ". Your structure grows as fast as your ideas do.",
      ),
      p("Explore the children of this card to see every shortcut."),
    ),
  },
  {
    id: "ai",
    parentId: null,
    contentJson: doc(
      h(2, "Your AI, inside your document."),
      p(
        "Fablecraft speaks ",
        bold("MCP"),
        " — the open protocol behind Claude Desktop, Codex, and a growing ecosystem of AI tools. Connect once, and your assistant can read your outline, add cards, draft sections, and restructure chapters alongside you.",
      ),
      p(
        "Not a chat window bolted on. Not a copy-paste dance. The AI works in the same tree you do, on the same cards, in real time.",
      ),
    ),
  },
  {
    id: "files",
    parentId: null,
    contentJson: doc(
      h(2, "Your work. Your disk. Forever."),
      p(
        "Fablecraft saves ",
        bold(".fable"),
        " files to your local drive. No account. No cloud sync. No subscription required to open what you wrote last year.",
      ),
      p(
        "When you want to share, export any branch to Markdown or HTML and take your structure into any tool in the world.",
      ),
    ),
  },

  // Navigation children
  {
    id: "nav-1",
    parentId: "nav",
    contentJson: doc(
      h(3, "Move through your document like a tree"),
      p(
        "Every card has a place — a parent above it, siblings beside it, children below. The arrow keys follow that shape so you never get lost.",
      ),
      ul(
        [bold("→"), text("   dive into the first child")],
        [bold("←"), text("   rise to the parent")],
        [bold("↑ ↓"), text("   step between siblings")],
      ),
      p(
        "Try it right now. Press ← to go back up to the Navigation card, then ↓ to find its next child.",
      ),
    ),
  },
  {
    id: "nav-2",
    parentId: "nav",
    contentJson: doc(
      h(3, "Zoom in on any level"),
      p(
        "Fablecraft shows you the level you're working on — the parent, its children, and just enough surrounding context to stay oriented. No infinite scroll. No mental overhead.",
      ),
      p(
        "Focus narrows to what matters. When you zoom out, the whole structure is still there, waiting.",
      ),
    ),
  },

  // Editing children
  {
    id: "editing-1",
    parentId: "editing",
    contentJson: doc(
      h(3, "Two modes, one rhythm"),
      p(
        "Fablecraft has a navigation mode (for moving and structuring) and an editing mode (for writing). You flip between them without ever reaching for the mouse.",
      ),
      ul(
        [bold("Enter"), text("   start writing in the selected card")],
        [bold("Esc"), text("   return to navigation")],
        [bold("Any letter"), text("   jump straight into editing")],
      ),
      p(
        "That last one matters. The moment a thought lands, you're already typing it.",
      ),
    ),
  },
  {
    id: "editing-2",
    parentId: "editing",
    contentJson: doc(
      h(3, "Build structure as you think"),
      p(
        "Ideas don't arrive in tidy lists. Sometimes a thought wants a sibling. Sometimes it needs to become a whole branch of its own. Fablecraft makes both trivial.",
      ),
      ul(
        [bold("⌘↓"), text("   new sibling below")],
        [bold("⌘↑"), text("   new sibling above")],
        [bold("⌘→"), text("   new child card")],
        [bold("Delete"), text("   remove the selected card")],
      ),
      p("The outline grows under your fingers. You never stop to arrange it."),
    ),
  },
  {
    id: "editing-3",
    parentId: "editing",
    contentJson: doc(
      h(3, "Rearrange without friction"),
      p(
        "The order of your thoughts rarely survives first contact with the page. Fablecraft lets you reshape it without dragging, clicking, or cutting and pasting.",
      ),
      ul(
        [bold("Shift+↓ / Shift+↑"), text("   reorder among siblings")],
        [bold("⌘Z / ⌘⇧Z"), text("   undo and redo")],
      ),
      p("Every structural move is just a keystroke. Every keystroke is reversible."),
    ),
  },

  // AI children
  {
    id: "ai-1",
    parentId: "ai",
    contentJson: doc(
      h(3, "A local MCP server, built in"),
      p(
        "Fablecraft runs an MCP server on your machine. Any MCP-aware AI — Claude Desktop, Codex, and others — can connect and start operating on your document.",
      ),
      p("It can:"),
      ul(
        "Read any card or subtree",
        "Add siblings and children anywhere in the tree",
        "Rewrite card content",
        "Navigate and restructure the whole document",
      ),
      p(
        "You keep writing. The AI works alongside you — not in a side panel, but in the same outline.",
      ),
    ),
  },
  {
    id: "ai-2",
    parentId: "ai",
    contentJson: doc(
      h(3, "Connect in seconds"),
      p("Two clicks in the command palette:"),
      ul(
        [bold("⌘K → Enable Claude Desktop")],
        [bold("⌘K → Enable Codex")],
      ),
      p(
        "Restart your AI client and Fablecraft appears as a tool. From that point on, your assistant can touch your document directly.",
      ),
    ),
  },

  // Files children
  {
    id: "files-1",
    parentId: "files",
    contentJson: doc(
      h(3, "Local files, no strings attached"),
      p(
        "Every document is a single ",
        bold(".fable"),
        " file on your disk. Back it up, drop it in Dropbox, commit it to git, email it to yourself. It's yours.",
      ),
      ul(
        "No account required",
        "No telemetry",
        "No cloud lock-in",
        "No risk of losing your work when a startup pivots",
      ),
      p("The file will still open in ten years."),
    ),
  },
  {
    id: "files-2",
    parentId: "files",
    contentJson: doc(
      h(3, "Export anywhere"),
      p(
        "When your structure is ready to become something else — a blog post, a manuscript, a deck — export any branch of the tree.",
      ),
      ul(
        [bold("⌘K → Export Level as Markdown"), text("   the current level and all its children")],
        [bold("⌘K → Export Level as HTML"), text("   same, in HTML")],
      ),
      p(
        "Your work doesn't live in a walled garden. Fablecraft is where you shape it; the rest of the world is where it goes.",
      ),
    ),
  },
];

function buildDemoCards() {
  const byParent = new Map<string | null, DemoCardSpec[]>();
  for (const spec of DEMO_CARD_SPECS) {
    const group = byParent.get(spec.parentId) ?? [];
    group.push(spec);
    byParent.set(spec.parentId, group);
  }
  const cards = DEMO_CARD_SPECS.map((spec) => {
    const siblings = byParent.get(spec.parentId) ?? [];
    return {
      documentId: DEMO_DOC_ID,
      id: spec.id,
      orderIndex: siblings.indexOf(spec),
      parentId: spec.parentId,
      type: "card" as const,
    };
  });
  const contents = DEMO_CARD_SPECS.map((spec) => ({
    cardId: spec.id,
    layerId: DEMO_LAYER_ID,
    contentJson: spec.contentJson,
  }));
  return { cards, contents };
}

const { cards: DEMO_CARDS, contents: DEMO_CONTENTS } = buildDemoCards();

const DEMO_SNAPSHOT: DocumentSnapshot = {
  summary: DEMO_SUMMARY,
  layers: [
    {
      color: "neutral",
      description: null,
      documentId: DEMO_DOC_ID,
      id: DEMO_LAYER_ID,
      isBase: true,
      layerIndex: 0,
      name: "Draft",
    },
  ],
  cards: DEMO_CARDS,
  contents: DEMO_CONTENTS,
  revisions: [],
};

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
