import { OverlayShell } from "./OverlayShell";

type HelpSheetMode = "commands" | "getting-started" | "shortcuts";

interface HelpSheetProps {
  mode: HelpSheetMode;
  onClose: () => void;
}

const shortcutRows = [
  ["Enter", "Edit the active card"],
  ["Type", "Start editing immediately with the typed character"],
  ["Escape", "Return to navigation"],
  ["Arrow keys", "Move through the spatial tree"],
  ["Tab + Arrow keys", "Navigate to nearby cards without leaving edit mode"],
  ["Cmd/Ctrl + Arrow keys", "Create siblings, children, or wrap a level"],
  ["Shift + Up / Down", "Move within the current column, even across parent groups"],
  ["Shift + Left", "Outdent the current card"],
  ["Shift + Right", "Indent under the sibling above as its last child"],
  ["Option + Up / Down", "Merge with the sibling above or below"],
  ["Cmd/Ctrl + F", "Search the document"],
  ["Cmd/Ctrl + K", "Toggle the command palette"],
];

const commandGroups = [
  {
    commands: ["New Document", "Open Document", "Import Markdown", "Export Level (MD / HTML)"],
    label: "Document",
  },
  {
    commands: ["Merge with Above", "Merge Below"],
    label: "Structure",
  },
  {
    commands: ["Getting Started", "Show Command List", "Show Shortcuts"],
    label: "Help",
  },
  {
    commands: ["Settings"],
    label: "Settings",
  },
  {
    commands: ["Enable Codex", "Enable Claude Desktop"],
    label: "Integrations",
  },
];

const gettingStartedRows = [
  ["1", "Start typing in the first card. Fablecraft opens a new document directly in edit mode."],
  ["2", "Press Enter on an empty line to split ideas into new cards as the structure becomes clearer."],
  ["3", "Use the arrow keys to move across the tree and Option + Up / Down to merge cards when a split no longer feels right."],
  ["4", "Open Search with Cmd/Ctrl + F and the command palette with Cmd/Ctrl + K whenever you need to jump or change course."],
];

export function HelpSheet({ mode, onClose }: HelpSheetProps) {
  const title =
    mode === "shortcuts"
      ? "Shortcuts"
      : mode === "getting-started"
        ? "Getting Started"
        : "Show Command List";

  return (
    <OverlayShell
      footer="Escape closes this sheet."
      title={title}
      widthClassName="max-w-[min(92vw,760px)]"
    >
      {mode === "getting-started" ? (
        <div className="grid gap-3">
          {gettingStartedRows.map(([label, description]) => (
            <div
              className="bg-[var(--fc-color-surface-strong)] px-5 py-4 shadow-[var(--fc-shadow-soft)]"
              key={label}
            >
              <p className="font-[var(--fc-font-ui)] text-xs uppercase tracking-[0.18em] text-[var(--fc-color-muted)]">
                Step {label}
              </p>
              <p className="mt-2 font-[var(--fc-font-content)] text-[1.05rem] leading-[1.45] text-[var(--fc-color-text)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      ) : mode === "shortcuts" ? (
        <div className="grid gap-3">
          {shortcutRows.map(([label, description]) => (
            <div
              className="bg-[var(--fc-color-surface-strong)] px-5 py-4 shadow-[var(--fc-shadow-soft)]"
              key={label}
            >
              <p className="font-[var(--fc-font-ui)] text-xs uppercase tracking-[0.18em] text-[var(--fc-color-muted)]">
                {label}
              </p>
              <p className="mt-2 font-[var(--fc-font-content)] text-[1.05rem] leading-[1.45] text-[var(--fc-color-text)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {commandGroups.map((group) => (
            <div
              className="bg-[var(--fc-color-surface-strong)] px-5 py-4 shadow-[var(--fc-shadow-soft)]"
              key={group.label}
            >
              <p className="font-[var(--fc-font-ui)] text-xs uppercase tracking-[0.18em] text-[var(--fc-color-muted)]">
                {group.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.commands.map((command) => (
                  <span
                    className="bg-[var(--fc-color-surface)] px-3 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-text)] shadow-[var(--fc-shadow-soft)]"
                    key={command}
                  >
                    {command}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-full bg-[var(--fc-color-text)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-on-dark)] shadow-[var(--fc-shadow-soft)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:-translate-y-[1px]"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </OverlayShell>
  );
}
