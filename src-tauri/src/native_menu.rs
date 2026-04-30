use serde::Serialize;
use tauri::{
    menu::{
        Menu, MenuBuilder, MenuEvent, MenuItemBuilder, SubmenuBuilder, HELP_SUBMENU_ID,
        WINDOW_SUBMENU_ID,
    },
    AppHandle, Emitter, Manager, Runtime,
};

pub const MENU_ACTION_EVENT: &str = "fablecraft://menu-action";

const APP_SETTINGS: &str = "app.settings";
const FILE_NEW_DOCUMENT: &str = "file.new_document";
const FILE_OPEN_DOCUMENT: &str = "file.open_document";
const FILE_SAVE: &str = "file.save";
const FILE_IMPORT_MARKDOWN: &str = "file.import_markdown";
const FILE_EXPORT_MARKDOWN: &str = "file.export_markdown";
const EDIT_UNDO: &str = "edit.undo";
const EDIT_REDO: &str = "edit.redo";
const CARD_MERGE_ABOVE: &str = "card.merge_above";
const CARD_MERGE_BELOW: &str = "card.merge_below";
const CARD_SHIFT_UP: &str = "card.shift_up";
const CARD_SHIFT_DOWN: &str = "card.shift_down";
const CARD_SPLIT: &str = "card.split";
const CARD_CREATE_CHILD: &str = "card.create_child";
const CARD_CREATE_PARENT: &str = "card.create_parent";
const CARD_CREATE_ABOVE: &str = "card.create_above";
const CARD_CREATE_BELOW: &str = "card.create_below";
const TOOLS_COMMAND_PALETTE: &str = "tools.command_palette";
const TOOLS_SEARCH: &str = "tools.search";
const TOOLS_ENABLE_CODEX: &str = "tools.enable_codex";
const TOOLS_ENABLE_CLAUDE_DESKTOP: &str = "tools.enable_claude_desktop";
const WINDOW_RELOAD: &str = "window.reload";
const HELP_SHORTCUTS: &str = "help.shortcuts";
const HELP_COMMANDS: &str = "help.commands";
const HELP_GETTING_STARTED: &str = "help.getting_started";
const HELP_REPORT_BUG: &str = "help.report_bug";
const HELP_REQUEST_FEATURE: &str = "help.request_feature";

#[derive(Clone, Serialize)]
struct MenuActionPayload<'a> {
    action: &'a str,
}

pub fn build_native_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let settings = MenuItemBuilder::with_id(APP_SETTINGS, "Settings")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;

    let new_document = MenuItemBuilder::with_id(FILE_NEW_DOCUMENT, "New Document")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let open_document = MenuItemBuilder::with_id(FILE_OPEN_DOCUMENT, "Open Document")
        .accelerator("CmdOrCtrl+O")
        .build(app)?;
    let save = MenuItemBuilder::with_id(FILE_SAVE, "Save")
        .accelerator("CmdOrCtrl+S")
        .build(app)?;
    let import_markdown =
        MenuItemBuilder::with_id(FILE_IMPORT_MARKDOWN, "Import Markdown").build(app)?;
    let export_markdown =
        MenuItemBuilder::with_id(FILE_EXPORT_MARKDOWN, "Export Markdown").build(app)?;

    let undo = MenuItemBuilder::with_id(EDIT_UNDO, "Undo")
        .accelerator("CmdOrCtrl+Z")
        .build(app)?;
    let redo = MenuItemBuilder::with_id(EDIT_REDO, "Redo")
        .accelerator("CmdOrCtrl+Shift+Z")
        .build(app)?;

    let merge_above = MenuItemBuilder::with_id(CARD_MERGE_ABOVE, "Merge Above")
        .accelerator("Alt+Up")
        .build(app)?;
    let merge_below = MenuItemBuilder::with_id(CARD_MERGE_BELOW, "Merge Below")
        .accelerator("Alt+Down")
        .build(app)?;
    let shift_up = MenuItemBuilder::with_id(CARD_SHIFT_UP, "Shift Up")
        .accelerator("Shift+Up")
        .build(app)?;
    let shift_down = MenuItemBuilder::with_id(CARD_SHIFT_DOWN, "Shift Down")
        .accelerator("Shift+Down")
        .build(app)?;
    let split = MenuItemBuilder::with_id(CARD_SPLIT, "Split")
        .accelerator("Tab+Enter")
        .build(app)?;
    let create_child = MenuItemBuilder::with_id(CARD_CREATE_CHILD, "Create Child")
        .accelerator("CmdOrCtrl+Right")
        .build(app)?;
    let create_parent = MenuItemBuilder::with_id(CARD_CREATE_PARENT, "Create Parent")
        .accelerator("CmdOrCtrl+Left")
        .build(app)?;
    let create_above = MenuItemBuilder::with_id(CARD_CREATE_ABOVE, "Create Above")
        .accelerator("CmdOrCtrl+Up")
        .build(app)?;
    let create_below = MenuItemBuilder::with_id(CARD_CREATE_BELOW, "Create Below")
        .accelerator("CmdOrCtrl+Down")
        .build(app)?;

    let command_palette = MenuItemBuilder::with_id(TOOLS_COMMAND_PALETTE, "Command Palette")
        .accelerator("CmdOrCtrl+K")
        .build(app)?;
    let search = MenuItemBuilder::with_id(TOOLS_SEARCH, "Search")
        .accelerator("CmdOrCtrl+F")
        .build(app)?;
    let enable_codex = MenuItemBuilder::with_id(TOOLS_ENABLE_CODEX, "Enable Codex").build(app)?;
    let enable_claude_desktop =
        MenuItemBuilder::with_id(TOOLS_ENABLE_CLAUDE_DESKTOP, "Enable Claude Desktop")
            .build(app)?;

    let reload = MenuItemBuilder::with_id(WINDOW_RELOAD, "Reload")
        .accelerator("CmdOrCtrl+R")
        .build(app)?;

    let shortcuts = MenuItemBuilder::with_id(HELP_SHORTCUTS, "Shortcuts").build(app)?;
    let commands = MenuItemBuilder::with_id(HELP_COMMANDS, "Commands").build(app)?;
    let getting_started =
        MenuItemBuilder::with_id(HELP_GETTING_STARTED, "Getting Started").build(app)?;
    let report_bug = MenuItemBuilder::with_id(HELP_REPORT_BUG, "Report a Bug").build(app)?;
    let request_feature =
        MenuItemBuilder::with_id(HELP_REQUEST_FEATURE, "Request a Feature").build(app)?;

    let app_menu = SubmenuBuilder::new(app, "Fablecraft")
        .about_with_text("About Fablecraft", None)
        .separator()
        .item(&settings)
        .separator()
        .hide_with_text("Hide Fablecraft")
        .hide_others_with_text("Hide Others")
        .show_all_with_text("Show All")
        .separator()
        .quit_with_text("Quit")
        .build()?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_document)
        .item(&open_document)
        .item(&save)
        .separator()
        .item(&import_markdown)
        .item(&export_markdown)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo)
        .separator()
        .cut()
        .copy()
        .paste()
        .build()?;

    let card_menu = SubmenuBuilder::new(app, "Card")
        .item(&merge_above)
        .item(&merge_below)
        .separator()
        .item(&shift_up)
        .item(&shift_down)
        .separator()
        .item(&split)
        .separator()
        .item(&create_child)
        .item(&create_parent)
        .item(&create_above)
        .item(&create_below)
        .build()?;

    let tools_menu = SubmenuBuilder::new(app, "Tools")
        .item(&command_palette)
        .item(&search)
        .separator()
        .item(&enable_codex)
        .item(&enable_claude_desktop)
        .build()?;

    let window_menu = SubmenuBuilder::with_id(app, WINDOW_SUBMENU_ID, "Window")
        .item(&reload)
        .minimize_with_text("Minimize")
        .fullscreen_with_text("Toggle Full Screen")
        .build()?;

    let help_menu = SubmenuBuilder::with_id(app, HELP_SUBMENU_ID, "Help")
        .item(&getting_started)
        .item(&shortcuts)
        .item(&commands)
        .separator()
        .item(&report_bug)
        .item(&request_feature)
        .build()?;

    MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&card_menu)
        .item(&tools_menu)
        .item(&window_menu)
        .item(&help_menu)
        .build()
}

pub fn handle_native_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    match event.id().0.as_str() {
        WINDOW_RELOAD => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.reload();
            }

            return;
        }
        FILE_NEW_DOCUMENT => emit_action(app, "new-document"),
        FILE_OPEN_DOCUMENT => emit_action(app, "open-document"),
        FILE_SAVE => emit_action(app, "save"),
        FILE_IMPORT_MARKDOWN => emit_action(app, "import-markdown"),
        FILE_EXPORT_MARKDOWN => emit_action(app, "export-markdown"),
        APP_SETTINGS => emit_action(app, "settings"),
        EDIT_UNDO => emit_action(app, "undo"),
        EDIT_REDO => emit_action(app, "redo"),
        CARD_MERGE_ABOVE => emit_action(app, "merge-with-above"),
        CARD_MERGE_BELOW => emit_action(app, "merge-below"),
        CARD_SHIFT_UP => emit_action(app, "shift-up"),
        CARD_SHIFT_DOWN => emit_action(app, "shift-down"),
        CARD_SPLIT => emit_action(app, "split"),
        CARD_CREATE_CHILD => emit_action(app, "create-child"),
        CARD_CREATE_PARENT => emit_action(app, "create-parent"),
        CARD_CREATE_ABOVE => emit_action(app, "create-above"),
        CARD_CREATE_BELOW => emit_action(app, "create-below"),
        TOOLS_COMMAND_PALETTE => emit_action(app, "command-palette"),
        TOOLS_SEARCH => emit_action(app, "search"),
        TOOLS_ENABLE_CODEX => emit_action(app, "enable-codex"),
        TOOLS_ENABLE_CLAUDE_DESKTOP => emit_action(app, "enable-claude-desktop"),
        HELP_GETTING_STARTED => emit_action(app, "help-getting-started"),
        HELP_SHORTCUTS => emit_action(app, "help-shortcuts"),
        HELP_COMMANDS => emit_action(app, "help-commands"),
        HELP_REPORT_BUG => emit_action(app, "help-report-bug"),
        HELP_REQUEST_FEATURE => emit_action(app, "help-request-feature"),
        _ => {}
    }
}

fn emit_action<R: Runtime>(app: &AppHandle<R>, action: &'static str) {
    let _ = app.emit(MENU_ACTION_EVENT, MenuActionPayload { action });
}
