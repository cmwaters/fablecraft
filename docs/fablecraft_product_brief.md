# Fablecraft — Product Specification&#x20;

## 1. Overview

Fablecraft is a desktop-first writing tool built around a **sideways tree of cards**.

Each card is a rich text editor. Cards form a hierarchical structure that users navigate spatially. The desktop editor exposes a single visible content plane per card.

The desktop editor remains the core product and stays local-first.
The public website at `https://fablecraft.xyz` is the companion surface for discovery, downloads, release communication, and support.

The product is:

- keyboard-first
- minimal (Typora-like)
- spatial (not list-based)
- AI-extensible via MCP
- anchored by a public website for download and product communication
- visually quiet, with soft pink-white paper surfaces and dark ink contrast across desktop and web
- on desktop, cards and panels should feel nearly square, with only slight corner rounding and a shadow-led, architectural treatment rather than soft or pill-like shapes

### 1.1 Product Surfaces

#### Desktop Editor

- primary writing surface
- local-first
- opens and edits `.fable` documents
- usable without any account

#### Public Website

- public home for Fablecraft
- primary download destination for the desktop app (hero link targets the latest GitHub macOS release artifact when release config is set)
- place to explain the product and show the editor in action (hero plus product screenshot)
- release notes, update guidance, bug reports, and feature requests may live on external surfaces until dedicated pages return
- later, the place to sign in for sync and hosted AI connector flows once those are specified

Rules:

- the website complements the desktop app; it does not replace it
- stage two does not introduce a browser-based editor
- local writing must remain usable without a network connection
- future sync and hosted AI connectors are staged follow-on capabilities, not part of the current local-only MVP behavior

---

## 2. Core Concepts

### 2.1 Cards

Cards are the fundamental unit.

A card is:

- a node in a tree
- a rich text editor
- variable height
- uniquely identified by `id`

Cards do NOT have titles.

### 2.2 Tree Structure

- Cards form a directed tree
- Structure is defined by:
  - `parent_id`
  - `order_index`
- Children are derived, not stored
- Paths (e.g. `0.2.1`) are computed

### 2.3 Single-plane Content

- topology and visible writing live in a single plane
- the desktop editor exposes no layer switching, creation, or deletion
- older files may still retain an implicit compatibility base layer in storage, but that is not a user-facing concept

---

## 3. Card Lifecycle

- New cards start empty
- Empty cards cannot create additional cards
- If abandoned empty → removed
- Backspace on an empty non-root card deletes it
- Cards always render fully (no collapsing)

---

## 4. Interaction Modes

```ts
navigation | editing | search | command
```

### Navigation mode

- structural movement
- creation
- deletion

### Editing mode

- text editing only

### Search mode

- Cmd/Ctrl+F results
- search is scoped to the document

### Command mode

- secondary actions (Cmd/Ctrl+K)

---

## 5. Keyboard Model

### Navigation

- Left → parent
- Right → first child
- Up → previous card in the current column
- Down → next card in the current column

Up/down follows the packed spatial column, even across different parent groups. Left/right changes depth.

### Movement

- Shift+Up / Down → move within the current column, including across parent groups
- Shift+Left → outdent
- Shift+Right → make the active card the last child of the sibling above
- Option+Up / Down → merge with the sibling above or below while keeping the current card

### Creation

- Cmd/Ctrl+Up / Down → siblings
- Cmd/Ctrl+Right → child
- Cmd/Ctrl+Left → wrap the current level in a new parent

### Editing

- Type → enter edit mode and insert the typed character
- Enter → edit mode
- Escape → navigation mode
- Backspace on empty card → delete card
- ArrowDown at the end of a card opens the card below in edit mode at the start of that card
- ArrowUp at the start of a card opens the card above in edit mode at the end of that card
- ArrowRight at the end of a card opens the first child in edit mode at the start of that card
- Tab+Arrow keys move between nearby cards without leaving edit mode
- Double Enter → new card below
- Tab+Enter → split at line
- markdown shortcuts render into rich text, including visible headings and lists
- unselected cards preserve that rich structure in preview mode

---

## 6. Spatial Layout (Critical)

### Core Principle

> The model moves **left to right**, not top to bottom.

### Layout

- workspace renders as a bounded stage that fills the window
- stage background matches the card surface exactly
- on macOS, the native title bar hides the Fablecraft title and uses the same light/dark background as the workspace
- Active card: centered
- Parents: left-middle column
- Children: right column
- Siblings: above and below the active card
- all cards remain rendered in the stage unless they are off-screen
- cards in the active neighborhood use a slightly lighter border when not selected
- cards outside the active neighborhood keep the same text and surface color, but lose shadow emphasis
- immediate parent aligns vertically with the active card
- the first immediate child is vertically centered on the active card, and later children stack below it even when other child groups share that column
- anchoring the active child group must not reorder neighboring sibling subtrees in that same child column
- when the active card has no children, the child column still reserves a full empty slot centered on the active card so neighboring sibling subtrees cannot visually read as its children
- that empty child slot matches the selected card footprint but stays visually invisible against the workspace background while remaining clickable for first-child creation
- no helper copy, mode labels, or structural labels outside cards

### Spacing

- column gap = sibling gap
- default = 24px

### Visibility

- show as much as fits
- prioritize parent + active card
- cards may be partially off-screen

### Card Size

- variable height
- height is tracked per card
- cards retain their measured height in both navigation and editing, and preview heights remeasure after content changes
- height measurement follows the full rendered card surface so selection does not change wrapping or sibling spacing
- the active card keeps the same content box and text reflow between navigation and edit mode
- cards keep generous internal padding without changing footprint across modes
- card content padding is expanded by 10px to increase breathing room
- focused cards do not resize just because they are selected
- focused and unfocused cards keep the same footprint
- selected cards keep the same thin border as unselected cards
- cards only grow when content adds lines
- no scrolling
- no nested scroll

### Mouse

- click card:

  - center
  - enter edit mode
  - cursor placed near click
- trackpad / wheel gestures pan the bounded stage without showing scrollbars

### Animation

- <150ms
- smooth
- slight ease-in/out

---

## 7. Single-plane Writing

- the desktop editor exposes one visible content plane only
- there is no layer UI, layer switching, or layer creation flow
- all card borders use the document theme rather than per-layer colors

---

## 8. Command Palette

Trigger: Cmd/Ctrl+K

Behavior:

- centered panel
- no title bar
- type to filter
- show at most 5 results
- arrows navigate
- Enter executes
- Escape closes
- settings are opened from here as a centered modal

Commands:

Default order:

- Help
- Settings

Document:

- New Document
- Open Document
- Import Markdown
- Export Level (MD / HTML)

Structure:

- Merge with Above
- Merge Below

Integrations:

- Enable Codex
- Enable Claude Desktop
- show a tick once the local config already contains the Fablecraft MCP registration

Help:

- Show Command List
- Show Shortcuts

NOT included:

- create/delete/move cards
- layer controls

---

## 9. Native Menu Bar

Desktop builds expose native menus with the following structure:

### Fablecraft

- About Fablecraft
- Settings
- Hide Fablecraft
- Hide Others
- Show All
- Quit

### File

- New Document
- Open Document
- Import Markdown
- Export Markdown

Import and export should appear together as a grouped block.

### Edit

- Undo
- Redo
- Cut
- Copy
- Paste

### Card

- Merge Above
- Merge Below
- Shift Up
- Shift Down
- Split
- Create Child
- Create Parent
- Create Above
- Create Below

### Tools

- Command Palette
- Search
- Enable Codex
- Enable Claude Desktop

### Window

- Reload
- Minimize
- Toggle Full Screen

### Help

- Shortcuts
- Commands

The native menu should trigger the same underlying application actions as keyboard shortcuts, editor actions, and command-palette commands.

---

## 10. Search

- Cmd/Ctrl+F
- search content in the document
- arrow navigation
- Enter → jump

---

## 11. Settings

Access: command palette

Command label: `Settings`

Minimal only.

Includes:

- theme
- light
- dark
- font
- text size
- default reading scale should stay slightly compact to preserve card density
- line height
- card width
- row-based inline controls instead of native selectors
- keyboard navigation is preserved: Up/Down move between setting rows, Left/Right change the current row
- while settings is open, those keys should not move the tree in the background
- settings panel stays inside the window and scrolls internally when needed
- changes apply immediately through centralized tokens

All UI values must be configurable tokens.

---

## 12. Startup Behavior

- reopen last document if exists
- otherwise show centered panel:
  - New
  - Open
  - Import

Keyboard accessible.

---

## 13. Storage

- `.fable` = single SQLite file

Rules:

- one document open at a time
- autosave only
- when the open `.fable` file changes externally, the workspace refreshes once local edits are no longer dirty

---

## 14. Import / Export

Import:

- markdown → single card
- import creates a fresh `.fable` document from the selected Markdown file

Export:

- one level only
- export targets the currently selected level
- export filename defaults to the document name
- markdown and html outputs separate cards with clear level separators

---

## 15. AI / MCP

- app exposes structure through a local MCP tool surface
- read tools: document, card, subtree
- local Claude-compatible stdio MCP server is available for external tool use
- mutation tools: set card text, create child, create sibling, wrap level, delete card
- external MCP writes should appear in the open document without manually reopening it
- compatibility metadata for older layer-backed files may still exist internally during the migration to the single-plane model

Rules:

- transactional
- one action = one undo
- structured errors
- payload limits enforced

---

## 16. Public Website

Hero slogan:

- `The Writers Tool for Structured Thought`

Core jobs:

- communicate what Fablecraft is and who it is for
- drive desktop downloads from `https://fablecraft.xyz` (hero CTA links to the latest GitHub macOS DMG via a stable `releases/latest/download/...` URL when release config is set)
- explain the spatial tree and local-first writing model through a single product screenshot
- prepare a future authenticated surface for sync and AI connector management
- deeper distribution and support surfaces (release notes, multi-platform download grid, feedback forms) may return or move to external pages as the product matures

Initial site structure (current):

- hero section with the core slogan and a download CTA (disabled label when the GitHub release config is absent)
- product screenshot section immediately below the hero (`public/screenshot.png`), then the footer

Rules:

- the site is a marketing, distribution, and support surface first
- the desktop app remains the primary place where writing happens
- update delivery may be website-backed, but the writing workflow stays local-first
- the macOS website download should resolve against the latest GitHub Release asset without client-side GitHub API calls
- feedback and release communication may use external tools (for example GitHub Issues or mail) until dedicated site sections are restored
- future sync and AI connector features require a separate explicit scope definition before implementation
- the website should stay sparse: generous spacing, minimal copy, and only the information required to download, understand, update, or contact the product
- the website should feel hero-led and architectural rather than section-heavy or dashboard-like

---

## 17. Non-Goals

- no sidebar
- no graph view
- no browser-based editor in stage two
- no mandatory account for local writing
- no collaboration
- no plugins
- no card linking (MVP)
- no multi-select
- no sync in the current MVP
- no hosted AI connector accounts in the current MVP

---

## 18. Summary

Fablecraft is a:

- spatial writing tool
- card-based tree
- single-plane editor
- keyboard-first interface
- desktop-first editor with a companion website for download and support

Its core innovation is allowing users to move across **levels of abstraction** while maintaining a clean, minimal interface.
Card identity:
- Each card shows a human-friendly structural number in the top-right corner.
- The current first-pass numbering model is grid-like by depth: root cards begin at `A01`, their children at `B01`, `B02`, and so on.
- The numbering is present in workspace cards and search results to make navigation and discussion easier without introducing titles.
Settings clarity:
- The settings dialog must make keyboard focus obvious at the row level, so users can tell which setting is currently targeted before changing values.
- Inline setting choices should read as tactile pill controls rather than plain text buttons.
- Titled overlays should use a subtle full-width divider under the heading so panels feel structured without introducing heavy dark borders.
- The shortcuts and command list panels should share the same soft, shadow-led overlay language as Settings and Search rather than using separate card-grid styling.
- Fablecraft should expose a short getting-started guide from the Help menu, the command palette, and the startup surface.
- The desktop startup surface should use the same `fablecraft` wordmark styling and slogan treatment as the website hero.
- The startup surface should use `Structured Thought, Locally Crafted.` as its tagline instead of `The Writers Tool for Structured Thought.`
- The startup tagline should sit below the horizontal rule, use a lighter tone, and render in capitalized styling.
- `Locally Crafted.` should render on its own line in the startup tagline.
- The app should always open on the startup surface rather than auto-reopening a document.
- If recent documents are known, the startup surface should show an `Open Recent` option that opens a dedicated recent-files panel with up to five `.fable` files ordered by recency.
- The recent-files panel should include a final `Back` option, and `Escape` should also return to the main startup menu.
- The startup surface should be keyboard-friendly: focus should land on the first row, the chevron should stay aligned to the current row, and up/down arrows should move between rows.
Editing behavior:
- Backspacing an empty structural parent that still has children must remove the wrapper and return focus to the child flow, not delete the entire subtree beneath it.
- Undo and redo should work in both navigation mode and editing mode, using the same document snapshot model rather than splitting behavior between modes.
- A newly created document should open directly into edit mode on the first card.
- The empty-card placeholder copy should read `Your story starts here` on the first card only, not on later root-level cards.
- Backspace should delete an empty root-level card when other root cards still exist; only the final remaining root card is protected.
- On the first/root card, `Escape` should not leave edit mode while the card is still empty.
