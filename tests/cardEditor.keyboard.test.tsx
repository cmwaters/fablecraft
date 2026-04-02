import { act } from "react";
import type { ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardEditor } from "../src/components/CardEditor";
import { contentJsonForPlainText } from "../src/domain/document/content";

function renderEditor(
  overrides: Partial<ComponentProps<typeof CardEditor>> = {},
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const props: ComponentProps<typeof CardEditor> = {
    canCreateStructure: true,
    canLeaveEditing: true,
    contentJson: contentJsonForPlainText("Hello world"),
    focusPlacement: null,
    isEditing: true,
    onConsumeFocusPlacement: vi.fn(),
    onConsumePendingTextInput: vi.fn(),
    onCreateBelow: vi.fn(),
    onCreateChild: vi.fn(),
    onCreateParentLevel: vi.fn(),
    onCreateSiblingAbove: vi.fn(),
    onCreateSiblingBelow: vi.fn(),
    onDeleteEmpty: vi.fn(),
    onRedo: vi.fn(),
    onMergeAbove: vi.fn(() => false),
    onMergeBelow: vi.fn(() => false),
    onNavigateAbove: vi.fn(() => false),
    onNavigateBelow: vi.fn(() => false),
    onNavigateChild: vi.fn(() => false),
    onNavigateParent: vi.fn(() => false),
    onRequestNavigation: vi.fn(),
    onSplitAtSelection: vi.fn(),
    onUndo: vi.fn(),
    onUpdateContent: vi.fn(),
    placeholder: "",
    pendingTextInput: null,
    ...overrides,
  };

  return { container, props, root };
}

describe("CardEditor keyboard behavior", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    document.body.innerHTML = "";
  });

  it("uses Tab+ArrowDown to navigate below instead of creating a sibling", async () => {
    const { container, props, root } = renderEditor({
      onNavigateBelow: vi.fn(() => true),
    });

    await act(async () => {
      root.render(<CardEditor {...props} />);
    });

    const editorElement = container.querySelector(".ProseMirror") as HTMLElement | null;

    expect(editorElement).not.toBeNull();

    await act(async () => {
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Tab",
        }),
      );
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
        }),
      );
    });

    expect(props.onNavigateBelow).toHaveBeenCalledTimes(1);
    expect(props.onCreateSiblingBelow).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Cmd+ArrowRight to create a child card", async () => {
    const { container, props, root } = renderEditor();

    await act(async () => {
      root.render(<CardEditor {...props} />);
    });

    const editorElement = container.querySelector(".ProseMirror") as HTMLElement | null;

    expect(editorElement).not.toBeNull();

    await act(async () => {
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
          metaKey: true,
        }),
      );
    });

    expect(props.onCreateChild).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Option+ArrowUp to merge with the card above", async () => {
    const { container, props, root } = renderEditor({
      onMergeAbove: vi.fn(() => true),
      onNavigateAbove: vi.fn(() => false),
    });

    await act(async () => {
      root.render(<CardEditor {...props} />);
    });

    const editorElement = container.querySelector(".ProseMirror") as HTMLElement | null;

    expect(editorElement).not.toBeNull();

    await act(async () => {
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          bubbles: true,
          key: "ArrowUp",
        }),
      );
    });

    expect(props.onMergeAbove).toHaveBeenCalledTimes(1);
    expect(props.onNavigateAbove).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("uses Cmd+Z to trigger editor undo through the shared history path", async () => {
    const { container, props, root } = renderEditor();

    await act(async () => {
      root.render(<CardEditor {...props} />);
    });

    const editorElement = container.querySelector(".ProseMirror") as HTMLElement | null;

    await act(async () => {
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "z",
          metaKey: true,
        }),
      );
    });

    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onRedo).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("keeps editing active on Escape for the empty first card", async () => {
    const { container, props, root } = renderEditor({
      canLeaveEditing: false,
      contentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
    });

    await act(async () => {
      root.render(<CardEditor {...props} />);
    });

    const editorElement = container.querySelector(".ProseMirror") as HTMLElement | null;

    await act(async () => {
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });

    expect(props.onRequestNavigation).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("moves to the first child when ArrowRight is pressed at the end of the text", async () => {
    const { container, props, root } = renderEditor({
      onNavigateChild: vi.fn(() => true),
    });

    await act(async () => {
      root.render(<CardEditor {...props} />);
    });

    const editorElement = container.querySelector(".ProseMirror") as HTMLElement | null;

    expect(editorElement).not.toBeNull();

    await act(async () => {
      editorElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
        }),
      );
    });

    expect(props.onNavigateChild).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });
});
