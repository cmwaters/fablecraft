# Fablecraft Agent Guide

## Source Of Truth

Future agents must treat these documents as authoritative:

- `docs/fablecraft_product_brief.md`
- `docs/fablecraft_engineering_brief.md`

The product brief is the source of truth for behavior.
The engineering brief is the source of truth for architecture, implementation plan, and acceptance criteria.

If the code and the briefs disagree, do not guess. Reconcile the mismatch first.

## Mandatory Documentation Sync

Any meaningful change to the codebase must be reflected in the repository briefs in the same change set.

Required rule:

- If behavior changes, update `docs/fablecraft_product_brief.md`.
- If architecture, implementation details, project structure, commands, or acceptance criteria change, update `docs/fablecraft_engineering_brief.md`.
- If a change affects both behavior and implementation, update both documents.
- Do not leave the repo in a state where code has moved on but the briefs are stale.

If something is ambiguous and should not be invented, leave a short TODO in code and, when relevant, note the ambiguity in the engineering brief instead of silently choosing a new behavior.

## Core Product Constraints

Do not violate these MVP rules unless the briefs are explicitly updated:

- Desktop app using Tauri + React + TypeScript
- `.fable` is a single SQLite file
- Local-first only, no backend
- One document open at a time
- Autosave only, no save button
- No sidebar
- No card titles
- No multi-select
- No collaboration, sync, plugins, graph view, or card linking in MVP

Layer constraints:

- Layers cannot be reordered
- Base layer can be renamed but cannot be deleted
- Maximum 7 layers total
- Deterministic colors only
- Sparse content is allowed in non-base layers

UI constraints:

- Minimal, Typora-like
- Keyboard-first
- Spatial, sideways tree
- Tokens must control spacing, colors, and animation

## Current Repo State

As of the current implementation:

- Phase 1 is implemented: scaffold, SQLite setup, `.fable` create/open, startup panel, reopen last document
- Phase 2 is implemented: cards, layers, card content, transactional snapshot save/load, revisions, autosave pipeline
- Phase 3 is implemented: navigation/editing modes, active-card editor, split behavior, creation/reorder/outdent keyboard actions, navigation undo foundation
- Phases 4 and 5 are implemented in their current MVP form: centered active card, parent/child/sibling spatial workspace, layer switching, layer creation panel, deterministic layer styling
- Phase 6 is implemented: command palette, search, settings modal, help sheet, and layer details flow
- Phase 7 is implemented: Markdown import plus selected-level Markdown / HTML export
- Phase 8 has a working first pass: local MCP tool registry, in-app MCP runner, Claude-compatible stdio MCP server, read tools, and mutation tools for text, layers, and basic tree structure

Still pending:

- External `Open in AI Client` handoff remains a TODO until a concrete target client contract is specified

Known intentional TODO:

- `Tab+Left` bifurcate is not implemented because the briefs do not define the structural behavior precisely enough yet

## Repo Structure

- `src/app`: app shell
- `src/components`: React UI components
- `src/domain/document`: tree, layer, navigation, split, serialization, and spatial domain logic
- `src/state`: Zustand stores for app, interaction, and document state
- `src/storage`: frontend Tauri invocation layer and autosave wiring
- `src/styles`: global CSS and centralized UI tokens
- `src-tauri/src/storage`: Rust SQLite repository, migrations, and persistence rules
- `tests`: Vitest coverage for domain logic and small storage helpers

Keep boundaries clean:

- Storage logic belongs in Rust or `src/storage`
- Pure document rules belong in `src/domain/document`
- UI interaction state belongs in Zustand stores
- Layout behavior belongs in components and layout/domain helpers, not the storage layer

## Commands

Run from repo root unless noted:

- `npm run tauri dev`
- `npm run build`
- `npm test`
- `cd src-tauri && cargo test`

## Testing Expectations

Do not skip tests for changes that affect behavior.

At minimum, run the relevant subset and prefer full verification when touching core flows:

- `npm test`
- `npm run build`
- `cd src-tauri && cargo test`

Add or update tests when changing:

- tree operations
- layer rules
- undo behavior
- serialization or snapshot persistence
- navigation behavior across uneven trees

## Implementation Guidance

- Prefer simple, robust solutions over abstractions that outrun the MVP
- Do not add features that are not in the briefs
- Keep UI tokens centralized and easy to tune
- Preserve local-first assumptions
- Keep `.fable` as a single SQLite file
- When changing keyboard behavior, verify it still matches the product brief
- When changing layout behavior, verify it still matches the spatial model in the product brief

## Before Finishing A Change

Before handing work off:

1. Update code.
2. Update tests.
3. Update `docs/fablecraft_product_brief.md` and/or `docs/fablecraft_engineering_brief.md` if the change affects them.
4. Run verification commands.
5. Call out any remaining TODOs or unresolved ambiguities clearly.
