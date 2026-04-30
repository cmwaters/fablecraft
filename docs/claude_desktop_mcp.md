# Claude Desktop MCP

Fablecraft includes a Claude-compatible local MCP server binary:

- `fablecraft-mcp`

Build it from the repo root:

```bash
npm run mcp:build
```

This creates the binary at:

- `src-tauri/target/release/fablecraft-mcp`

## Registering With Claude Desktop

Fablecraft does not yet ship as a Claude Desktop `.mcpb` extension package. For now, register the local stdio server directly in Claude Desktop's MCP config.

Add an entry like this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fablecraft": {
      "command": "/Users/callum/Developer/fablecraft/src-tauri/target/release/fablecraft-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

On macOS, the config file is typically:

- `~/Library/Application Support/Claude/claude_desktop_config.json`

If the file does not exist yet, create it.

After saving the config:

1. Restart Claude Desktop.
2. Open a new chat.
3. Use the tools / connectors picker to confirm the `fablecraft` server is available.

## Tool Workflow

The Claude MCP server operates on explicit `.fable` paths. Tool calls should pass `documentPath` as an absolute path, for example:

- `/Users/callum/Documents/story.fable`

If the desktop app has opened or created a document in the current OS session, `fablecraft_get_open_documents` can discover the active path list from Fablecraft's local session file. The response may include more than one path when multiple app instances, windows, or future tabs advertise different documents.

Recommended sequence inside Claude:

1. `fablecraft_get_open_documents` when the document path is not already known
2. `fablecraft_get_document`
3. `fablecraft_get_subtree`
4. Mutation tools such as `fablecraft_set_card_text`, `fablecraft_create_child`, or `fablecraft_delete_card`

## Current Tool Set

Read tools:

- `fablecraft_get_open_documents`
- `fablecraft_get_document`
- `fablecraft_get_card`
- `fablecraft_get_subtree`

Mutation tools:

- `fablecraft_set_card_text`
- `fablecraft_create_child`
- `fablecraft_create_sibling_before`
- `fablecraft_create_sibling_after`
- `fablecraft_move_card`
- `fablecraft_wrap_level_in_parent`
- `fablecraft_delete_card`

`fablecraft_get_document` returns `treeDepthCounts`, where `[1, 4, 7, 32]` means the root depth has 1 card, the next depth has 4 cards, and so on. `fablecraft_get_card` returns ordered direct `childCardIds`. Mutation tools return lightweight status payloads rather than full document snapshots.

`fablecraft_move_card` takes `cardId` plus exactly one of `beforeCardId` or `afterCardId`. The target card determines the destination parent, so moving before or after a card can also reparent the moved card while preserving its subtree.

Layers are not exposed through MCP. Older layer-backed files are migrated into the single-plane document schema when opened.

## Notes

- The server is local stdio, intended for Claude Desktop / Claude Code style integrations.
- The server enforces payload limits and returns structured tool errors.
- The app no longer exposes AI actions in the command palette. This document is the manual integration path.
