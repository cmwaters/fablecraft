# Fablecraft — Engineering Brief

## 1. Purpose

This document defines the **technical architecture, stack, implementation plan, and acceptance tests** required to build the Fablecraft MVP.

The Product Specification is the source of truth for behavior.
This brief translates it into **buildable engineering instructions**.

---

## 2. Core Technical Decisions

### Desktop
- Tauri (Rust + WebView)

### Frontend
- React + TypeScript
- Vite
- browser builds render the public website
- Tauri builds render the desktop editor

### State
- Zustand

### Editor
- Tiptap (ProseMirror)

### Styling
- Tailwind
- Centralized UI tokens (spacing, colors, animation)
- light mode uses a shared soft pink-white paper and dark-ink palette across the website and desktop app
- shadows stay restrained so borders and spacing do most of the visual work
- desktop cards and panels use only slight corner rounding and rely on shadow hierarchy instead of visible borders

### Storage
- SQLite
- `.fable` = single SQLite file
- Rust: `rusqlite`

### Validation
- Zod

### Testing
- Vitest (unit)
- Optional: Playwright (e2e)

### Website Deployment
- static frontend deployment should work cleanly on Vercel
- the macOS release download must be derived from environment-configured GitHub metadata (`siteContent`) so the website can point at `releases/latest/download/...` without browser-side API calls
- optional future feedback endpoints can reuse the same environment-driven pattern when site forms return
- the website must still render gracefully when those hosted endpoints are not configured

---

## 3. Architecture Layers

### Storage Layer
- SQLite schema
- open/create `.fable`
- autosave

### Domain Layer
- tree operations
- single-plane content operations
- undo logic

### UI State
- active card
- mode

### Editor Layer
- Tiptap integration
- markdown-style rich-text shortcuts
- split + double-enter behavior

### Layout Layer
- sideways tree
- centering logic
- bounded stage-style workspace
- full-tree rendering with overflow-hidden clipping
- fixed viewport with no scrollbars
- macOS title bar hidden-title transparent chrome synced to the active light/dark background
- border-only mode indication

### MCP Layer
- tool endpoints
- error handling

### Website Layer
- runtime split between browser and Tauri
- public landing page (hero, product screenshot, footer) and marketing content
- hero download link when `VITE_FABLECRAFT_GITHUB_OWNER`, `VITE_FABLECRAFT_GITHUB_REPO`, and `VITE_FABLECRAFT_DOWNLOAD_MAC_ASSET_NAME` are configured; `siteContent` retains Windows/Linux env slots for future multi-platform or off-page distribution
- future authenticated surface for sync and AI connector management
- sparse editorial layout with generous whitespace and minimal copy
- hero-led composition with a very light header and line-based section dividers where sections exist

---

## 4. Data Model

### cards
- id
- document_id
- parent_id
- order_index
- type

### layers
- retained only as compatibility storage for older documents
- the desktop editor always works against the implicit base layer

### card_content
- card_id
- layer_id
- note: `layer_id` remains in storage for backward compatibility, but the desktop editor operates as a single-plane writer
- content_json

### revisions
- id
- snapshot

---

## 5. UI Tokens (Critical)

All UI values must be centralized:

```ts
spacing: 24px
cardHeight: 84px
cardWidth: 468px default, 500px wide setting
contentSize: tokenized
contentLineHeight: tokenized
animation: ~140ms ease-in-out
```

---

## 6. Implementation Plan

### Phase 1 — Setup
- scaffold app
- SQLite schema
- startup screen

### Phase 2 — Tree
- create/move/delete cards
- autosave

### Phase 3 — Navigation
- keyboard navigation
- edit mode
- undo

### Phase 4 — Layout
- centered card
- sideways tree

### Phase 5 — Simplification
- remove visible layers from the desktop UX
- treat the document as a single visible content plane
- keep the implicit base layer only as a storage compatibility detail

### Phase 6 — Command + Search
- command palette
- search
- native File / Edit desktop menu wired into the same app actions
- settings modal via command palette
- settings uses row-based inline controls rather than native select controls
- theme options are simplified to Light and Dark
- default reading scale stays slightly compact to preserve card density
- card shells use an additional 10px of internal content padding while preserving active vs inactive parity
- keyboard access remains intact: Up/Down move between setting rows, Left/Right change the current row
- while settings is open, workspace keyboard navigation is suspended so keys do not move cards in the background
- search scoped to the document
- Cmd/Ctrl+K toggles the centered palette
- Cmd/Ctrl+F opens centered search

### Phase 7 — Import/Export
- markdown import/export
- startup import creates a new `.fable` document and seeds the root card from Markdown
- export writes Markdown or HTML for the currently selected level
- export save dialogs default to the document name

### Phase 8 — MCP
- server scaffold
- read tools
- local Tauri-backed tool registry exposed through invoke commands
- Claude-compatible local stdio MCP binary: `fablecraft-mcp`
- Cargo `default-run` remains `fablecraft` so `npm run tauri dev` launches the desktop app binary instead of the MCP binary
- read tools: `fablecraft_get_document`, `fablecraft_get_card`, `fablecraft_get_subtree`
- mutation tools: `fablecraft_set_card_text`, `fablecraft_create_child`, `fablecraft_create_sibling_after`, `fablecraft_wrap_level_in_parent`, `fablecraft_delete_card`
- structured payload limits on tool args and responses
- the workspace polls a lightweight document clock before loading a full `.fable` snapshot, and commits external changes when there are no unsaved local edits
- MCP remains available as an external integration surface rather than an in-app command palette action
- layer-oriented MCP compatibility surfaces may remain temporarily during migration, but they are no longer part of the desktop UX contract

### Phase 9 — Website
- add a browser-only companion website inside the same frontend repo
- detect runtime at startup so browser builds render the website and Tauri builds keep the editor
- implement a minimal sophisticated landing page for `https://fablecraft.xyz`
- include hero, a scroll-first product screenshot served from `public/screenshot.png`, and footer; the hero download control uses `siteDownloads` and builds the macOS URL from GitHub release env metadata when present, otherwise a muted non-link label
- keep release metadata environment-configurable for Vercel deployment (`siteContent` retains Windows/Linux env URLs for future hero or off-site use)
- keep browser layouts scrollable without breaking the desktop app's fixed-height workspace shell
- add a GitHub Actions release workflow that runs on `v*` tags, builds an arm64 macOS `.dmg`, renames it to the stable public asset name `Fablecraft-macos-arm64.dmg`, and uploads it to the GitHub Release

---

## 7. Acceptance Tests (Core)

### Navigation
- arrows navigate correctly
- up/down move within the packed spatial column
- left/right change depth only
- typing any printable character enters edit mode and forwards that character into the editor
- Cmd/Ctrl+ArrowUp / Down / Right / Left create siblings, children, and wrapped parents
- Shift+Up / Down moves within the packed column and may reparent a card when crossing into a neighboring parent group
- Shift+Right indents the active card under the sibling above as its last child
- Option+Up / Down merges the active card with the sibling above or below while preserving the active card id
- no invalid moves
- empty cards cannot spawn new cards

### Editing
- enter/escape behavior correct
- backspace deletes empty non-root cards
- ArrowDown at the end of a card moves into the card below in edit mode at the start of that card
- ArrowUp at the start of a card moves into the card above in edit mode at the end of that card
- ArrowRight at the end of a card moves into the first child in edit mode at the start of that card
- Tab+Arrow navigates nearby cards without leaving edit mode
- Option+Up / Down in edit mode merges with the sibling above or below without leaving edit mode
- markdown shortcuts render correctly, including visible list and heading styling
- preview mode preserves heading and list structure after a card is deselected
- double-enter creates a sibling below and trims the trailing empty paragraph from the source card
- split works

### Layout
- active card centered
- workspace stage fills the available window instead of clipping to an internal max width
- workspace background matches the card surface rather than using a separate tint
- on macOS, the native title bar hides the app title and matches the active light/dark background instead of showing a separate dark strip
- no helper text outside cards
- cards do not resize on selection alone
- preview cards retain measured height instead of collapsing back to the minimum, and they remeasure when content changes
- measured card height uses the full rendered card surface so edit mode does not change wrapping or sibling spacing
- the active card keeps the same renderer footprint between navigation and editing
- increased internal card padding still preserves the same active vs inactive footprint
- focused and unfocused cards keep the same footprint
- cards use shadow rather than visible borders
- navigation focus is conveyed by a darker shadow on the selected card
- editing mode deepens the selected card shadow further so it feels elevated
- neighborhood cards keep full text contrast and a soft shadow
- non-neighborhood cards keep the same text and surface color, but render without shadow emphasis
- immediate parent aligns with the active card
- the first immediate child aligns to the active card centerline, and later children stack below it even when that child column also contains other subtree groups
- the active child-group anchor must preserve the top-to-bottom order of neighboring sibling subtrees in that column
- when the active card has no children, the child column still reserves a centered empty slot with the active card's measured footprint before sibling child groups above and below are packed
- the workspace renders that reserved slot as an invisible click target rather than a visible placeholder, and may use it to create the first child when card creation is allowed
- no nested scroll
- no scrollbars
- wheel / trackpad panning moves the stage

### Single-plane model
- the desktop editor exposes no visible layer UI
- content search and editing work against one visible document plane
- any retained storage-layer compatibility is invisible to the user

### Storage
- autosave works
- reopen restores state
- import/export file reads and writes succeed through Tauri commands

### Import / Export
- startup and command palette imports create a new `.fable` document from a Markdown file
- export writes Markdown and HTML for the currently selected level

### Notices
- transient notices auto-dismiss
- repeated external reload polling must not keep a notice alive when the document contents are unchanged
- document clock metadata churn alone must not trigger an external reload notice
- revision-only save churn must not trigger an external reload notice

### Command + Search
- Cmd/Ctrl+K opens a centered command palette
- desktop builds expose native Fablecraft / File / Edit / Card / Tools / Window / Help menus
- native File groups import and export together
- native Undo / Redo target the active editor in editing mode and the navigation history stack in navigation mode
- native Card actions reuse the same structural operations as keyboard shortcuts
- native Tools includes Enable Codex and Enable Claude Desktop alongside palette and search
- native Window includes Reload, Minimize, and Toggle Full Screen only
- the palette shows at most five filtered results and stays input-focused until dismissed
- Show Command List, Settings, Enable Codex, and Enable Claude Desktop are the leading default commands
- the help sheet lists both Show Command List and Show Shortcuts
- the help sheet includes the merge shortcuts and merge command labels
- the command palette exposes Merge with Above and Merge Below when the active card has sibling targets
- integration setup commands show a tick when the local config already contains the Fablecraft MCP entry
- Cmd/Ctrl+F opens centered search over the document
- settings labels clearly distinguish theme, text size, line height, and card width
- settings overlays stay within the viewport and scroll internally when content is tall
- settings update token-backed UI immediately and persist locally

### MCP
- `get_card` and `get_subtree` return structured JSON for the active document plane
- `set_card_text` persists through the repository and refreshes the open snapshot
- the Claude-compatible stdio binary accepts explicit `.fable` paths so Claude Desktop can call it directly
- local integration enablement searches both bundled app locations and nearby `target/release` / `src-tauri/target/release` development binaries
- structural tree mutation is exposed through create child, create sibling, wrap level, and delete card tools
- external `.fable` changes should appear in the open app without a manual reopen when the document is not dirty
- MCP mutations remain a single undo step in the app state
- oversized MCP payloads return structured errors instead of partial responses

### Website
- browser builds render the public landing page instead of the desktop startup chooser
- the hero presents `The Writers Tool for Structured Thought`
- the first section after the hero shows the product workspace screenshot (`/screenshot.png` from `public/`), and no further main sections appear before the footer
- the website uses a minimal editorial layout distinct from the desktop editor UI
- the website and desktop app share the same soft pink-white paper and dark-ink visual language
- the Tauri startup window background must match the light paper surface so the transparent title bar does not flash white
- when `VITE_FABLECRAFT_GITHUB_OWNER`, `VITE_FABLECRAFT_GITHUB_REPO`, and `VITE_FABLECRAFT_DOWNLOAD_MAC_ASSET_NAME` are set, the hero primary action is a working download link to `https://github.com/<owner>/<repo>/releases/latest/download/<asset>`; when unset, the same label renders disabled (muted)
- the canonical public macOS asset is `Fablecraft-macos-arm64.dmg`, uploaded by the tagged GitHub release workflow
- `.env.example` documents the required website env vars for Vercel or other static hosting
- maintainers publish a new website-backed macOS download by pushing a `v*` tag that matches the desktop version and letting the GitHub Actions workflow attach the renamed DMG asset to the release
- Tauri desktop behavior remains unchanged when the app runs in desktop mode

---

## 8. Constraints

- no sidebar
- no card titles
- no plugins
- no collaboration

---

## 9. Definition of Done

- create/open document
- full keyboard navigation
- edit cards
- layout stable
- command palette works
- search works
- import/export works
- browser build ships the public website (hero, screenshot, footer) with a working hero download link when the GitHub macOS release env metadata is set

---

## 10. Notes for AI

- do not invent features
- prefer simple solutions
- leave TODOs if unclear
- keep UI adjustable via tokens
- prefer env-configurable URLs over hard-coded deployment assumptions for website infrastructure
Card numbering:
- Card numbering is derived at runtime from document structure, not stored in SQLite.
- The current implementation assigns labels by depth and visual order using a depth letter plus two-digit sequence, for example `A01`, `B01`, `B02`.
- Search results must display the derived card label alongside matched content.
Settings presentation:
- Settings rows should expose row-level keyboard focus visually with a leading chevron-style cue.
- Setting options may use stylized capsule controls, but keyboard behavior remains row-based: up/down moves between rows and left/right changes the current value.
- Shared titled overlays should render a soft full-width rule beneath the title inside `OverlayShell`.
- `HelpSheet` should use the same surface and shadow treatment as Settings/Search overlays so support panels read as one coherent family.
- Help support surfaces should include a `getting-started` mode reachable from the native Help menu, command palette, and the startup surface.
- The startup and booting panels should visually mirror the website hero wordmark treatment instead of using a separate desktop-only title style.
- Startup should read recent-document history only to populate an `Open Recent` path into a dedicated recent-files submenu; bootstrap should no longer auto-open any document.
- Recent-document history should store up to five deduplicated paths in recency order while preserving the legacy single-path key as a compatibility fallback.
- `StartupPanel` should use `Structured Thought, Locally Crafted.` as its sole tagline, rendered below the horizontal rule in a lighter uppercase style with `Locally Crafted.` on a second line, and implement stable row-based keyboard focus so up/down arrows move between rows, `Escape` returns from the recent-files submenu, and the row chevron stays tied to the current selection state.
Tree editing:
- Empty-card backspace in the editor must distinguish between leaf deletion and wrapper removal.
- If the active empty card has children, the workspace should unwrap that card and restore focus to the originating child when known, otherwise the first child.
- Document history should maintain both editing and navigation stacks in the shared store so undo/redo can be dispatched consistently from keyboard shortcuts and native menu actions in either mode.
- New-document entry points should switch the app into editing mode immediately after opening the created document.
- The editor placeholder string is `Your story starts here` for the first root card only; later root cards and non-root cards should render without placeholder copy.
- Empty-card deletion should allow removing a root-level card whenever more than one root card exists, while still preventing deletion of the final remaining root.
- `CardEditor` should suppress `Escape`-to-navigation on the empty root card so startup editing does not strand the user in navigation mode.
