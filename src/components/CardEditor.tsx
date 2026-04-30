import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { listenForFrontendMenuActions } from "../lib/nativeMenu";

interface CardEditorProps {
  canLeaveEditing?: boolean;
  canCreateStructure: boolean;
  contentJson: string;
  focusPlacement?: "start" | "end" | null;
  onCreateChild: () => void;
  onCreateParentLevel: () => void;
  onCreateSiblingAbove: () => void;
  onCreateSiblingBelow: () => void;
  isEditing: boolean;
  onCreateBelow: () => void;
  onConsumeFocusPlacement: () => void;
  onConsumePendingTextInput: () => void;
  onDeleteEmpty: () => void;
  onRedo: () => void;
  onMergeAbove: () => boolean;
  onMergeBelow: () => boolean;
  onNavigateAbove: (placement?: "start" | "end") => boolean;
  onNavigateBelow: (placement?: "start" | "end") => boolean;
  onNavigateChild: (placement?: "start" | "end") => boolean;
  onNavigateParent: (placement?: "start" | "end") => boolean;
  pendingTextInput?: string | null;
  onRequestNavigation: () => void;
  onSplitAtSelection: (selectionStart: number, selectionEnd: number) => void;
  onUndo: () => void;
  onUpdateContent: (contentJson: string) => void;
  placeholder?: string;
}

let tabKeyHeldAcrossEditors = false;
let tabKeyListenersAttached = false;

function setTabKeyHeldAcrossEditors(isHeld: boolean) {
  tabKeyHeldAcrossEditors = isHeld;
}

function ensureTabKeyListeners() {
  if (tabKeyListenersAttached || typeof window === "undefined") {
    return;
  }

  window.addEventListener("keyup", (event) => {
    if (event.key === "Tab") {
      setTabKeyHeldAcrossEditors(false);
    }
  });
  window.addEventListener("blur", () => {
    setTabKeyHeldAcrossEditors(false);
  });
  tabKeyListenersAttached = true;
}

function selectionTextOffsets(editor: NonNullable<ReturnType<typeof useEditor>>) {
  const { doc, selection } = editor.state;
  const before = doc.textBetween(0, selection.from, "\n\n");
  const selected = doc.textBetween(selection.from, selection.to, "\n\n");

  return {
    end: before.length + selected.length,
    start: before.length,
  };
}

function editorIsEffectivelyEmpty(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n\n").trim().length === 0;
}

function editorTextLength(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n\n").length;
}

export function isSelectionAtCardBoundary(
  selectionStart: number,
  selectionEnd: number,
  textLength: number,
  direction: "up" | "down" | "right",
) {
  if (direction === "up") {
    return selectionStart === 0;
  }

  return selectionEnd === textLength;
}

export function CardEditor({
  canLeaveEditing = true,
  canCreateStructure,
  contentJson,
  focusPlacement = null,
  onCreateChild,
  onCreateParentLevel,
  onCreateSiblingAbove,
  onCreateSiblingBelow,
  isEditing,
  onCreateBelow,
  onConsumeFocusPlacement,
  onConsumePendingTextInput,
  onDeleteEmpty,
  onRedo,
  onMergeAbove,
  onMergeBelow,
  onNavigateAbove,
  onNavigateBelow,
  onNavigateChild,
  onNavigateParent,
  pendingTextInput = null,
  onRequestNavigation,
  onSplitAtSelection,
  onUndo,
  onUpdateContent,
  placeholder = "",
}: CardEditorProps) {
  ensureTabKeyListeners();
  const tabHeldRef = useRef(tabKeyHeldAcrossEditors);
  const wasEditingRef = useRef(false);
  const isTabHeld = () => tabHeldRef.current || tabKeyHeldAcrossEditors;
  const editor = useEditor({
    autofocus: false,
    content: JSON.parse(contentJson),
    editorProps: {
      attributes: {
        class:
          "fc-editor w-full min-h-[1.5rem] outline-none font-[var(--fc-font-content)] text-[length:var(--fc-content-size)] leading-[var(--fc-content-line-height)] text-[var(--fc-color-text)]",
      },
      handleKeyDown(_, event) {
        if (!editor) {
          return false;
        }

        if (event.key === "Escape") {
          if (!canLeaveEditing) {
            event.preventDefault();
            return true;
          }

          event.preventDefault();
          onRequestNavigation();
          return true;
        }

        if (
          (event.metaKey || event.ctrlKey) &&
          event.altKey === false &&
          event.key.toLowerCase() === "z"
        ) {
          event.preventDefault();

          if (event.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }

          return true;
        }

        if (
          event.altKey &&
          event.metaKey === false &&
          event.ctrlKey === false &&
          event.shiftKey === false &&
          (event.key === "ArrowUp" || event.key === "ArrowDown")
        ) {
          const merged =
            event.key === "ArrowUp" ? onMergeAbove() : onMergeBelow();

          if (merged) {
            event.preventDefault();
            return true;
          }
        }

        if (
          (event.metaKey || event.ctrlKey) &&
          event.altKey === false &&
          event.shiftKey === false
        ) {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!canCreateStructure) {
              return true;
            }

            onCreateSiblingAbove();
            return true;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!canCreateStructure) {
              return true;
            }

            onCreateSiblingBelow();
            return true;
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            if (!canCreateStructure) {
              return true;
            }

            onCreateChild();
            return true;
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (!canCreateStructure) {
              return true;
            }

            onCreateParentLevel();
            return true;
          }
        }

        if (isTabHeld() && event.key === "ArrowUp") {
          event.preventDefault();
          onNavigateAbove("end");
          return true;
        }

        if (isTabHeld() && event.key === "ArrowDown") {
          event.preventDefault();
          onNavigateBelow("end");
          return true;
        }

        if (isTabHeld() && event.key === "ArrowRight") {
          event.preventDefault();
          onNavigateChild("end");
          return true;
        }

        if (isTabHeld() && event.key === "ArrowLeft") {
          event.preventDefault();
          onNavigateParent("end");
          return true;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          const offsets = selectionTextOffsets(editor);
          const direction = event.key === "ArrowUp" ? "up" : "down";

          if (
            editor.state.selection.empty &&
            isSelectionAtCardBoundary(
              offsets.start,
              offsets.end,
              editorTextLength(editor),
              direction,
            )
          ) {
            const moved =
              direction === "up" ? onNavigateAbove() : onNavigateBelow();

            if (moved) {
              event.preventDefault();
              return true;
            }
          }
        }

        if (event.key === "ArrowRight") {
          const offsets = selectionTextOffsets(editor);

          if (
            editor.state.selection.empty &&
            isSelectionAtCardBoundary(
              offsets.start,
              offsets.end,
              editorTextLength(editor),
              "right",
            )
          ) {
            const moved = onNavigateChild();

            if (moved) {
              event.preventDefault();
              return true;
            }
          }
        }

        if (
          event.key === "Backspace" &&
          event.metaKey === false &&
          event.ctrlKey === false &&
          event.altKey === false &&
          editorIsEffectivelyEmpty(editor)
        ) {
          event.preventDefault();
          onDeleteEmpty();
          return true;
        }

        if (event.key === "Tab") {
          event.preventDefault();
          tabHeldRef.current = true;
          setTabKeyHeldAcrossEditors(true);
          return true;
        }

        if (event.key === "Enter" && event.shiftKey === false && event.altKey === false && event.metaKey === false && event.ctrlKey === false) {
          if (isTabHeld()) {
            event.preventDefault();
            if (!canCreateStructure) {
              return true;
            }

            const offsets = selectionTextOffsets(editor);
            onSplitAtSelection(offsets.start, offsets.end);
            return true;
          }

          const isEmptyParagraph =
            editor.state.selection.empty &&
            editor.state.selection.$from.parent.type.name === "paragraph" &&
            editor.state.selection.$from.parent.textContent.trim() === "";

          if (isEmptyParagraph) {
            event.preventDefault();
            if (!canCreateStructure) {
              return true;
            }

            onCreateBelow();
            return true;
          }
        }

        return false;
      },
    },
    extensions: [
      Placeholder.configure({
        emptyEditorClass: "is-editor-empty",
        placeholder,
      }),
      StarterKit,
    ],
    immediatelyRender: false,
    onFocus() {
      if (!isEditing) {
        // The workspace owns mode transitions; this editor just keeps the caret ready.
      }
    },
    onUpdate({ editor: nextEditor }) {
      onUpdateContent(JSON.stringify(nextEditor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(isEditing);

    if (isEditing && !wasEditingRef.current) {
      editor.commands.focus("end");
    } else if (!isEditing && wasEditingRef.current) {
      editor.commands.blur();
    }

    wasEditingRef.current = isEditing;
  }, [editor, isEditing]);

  useEffect(() => {
    if (!editor || !isEditing || !focusPlacement) {
      return;
    }

    editor.commands.focus(focusPlacement);
    onConsumeFocusPlacement();
  }, [editor, focusPlacement, isEditing, onConsumeFocusPlacement]);

  useEffect(() => {
    if (!editor || !isEditing || !pendingTextInput) {
      return;
    }

    editor.commands.insertContent(pendingTextInput);
    onConsumePendingTextInput();
  }, [editor, isEditing, onConsumePendingTextInput, pendingTextInput]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentJson = JSON.stringify(editor.getJSON());

    if (currentJson !== contentJson) {
      editor.commands.setContent(JSON.parse(contentJson), { emitUpdate: false });
    }
  }, [contentJson, editor]);

  useEffect(() => {
    if (!editor || !isEditing) {
      return;
    }

    return listenForFrontendMenuActions((action) => {
      if (action === "undo") {
        onUndo();
        return;
      }

      if (action === "redo") {
        onRedo();
        return;
      }

      if (action === "split" && canCreateStructure) {
        const offsets = selectionTextOffsets(editor);
        onSplitAtSelection(offsets.start, offsets.end);
      }
    });
  }, [canCreateStructure, editor, isEditing, onRedo, onSplitAtSelection, onUndo]);

  if (!editor) {
    return null;
  }

  return <EditorContent className="w-full" editor={editor} />;
}
