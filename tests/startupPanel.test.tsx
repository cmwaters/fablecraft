import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartupPanel } from "../src/components/StartupPanel";
import { useAppStore } from "../src/state/appStore";

const promptForNewDocument = vi.fn();
const promptForOpenDocument = vi.fn();
const importMarkdownDocument = vi.fn();
const rememberLastDocumentPath = vi.fn();

vi.mock("../src/app/documentActions", () => ({
  promptForNewDocument: () => promptForNewDocument(),
  promptForOpenDocument: () => promptForOpenDocument(),
}));

vi.mock("../src/app/importExportActions", () => ({
  importMarkdownDocument: () => importMarkdownDocument(),
}));

vi.mock("../src/storage/lastDocument", () => ({
  rememberLastDocumentPath: (...args: unknown[]) => rememberLastDocumentPath(...args),
}));

describe("StartupPanel", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    promptForNewDocument.mockReset();
    promptForOpenDocument.mockReset();
    importMarkdownDocument.mockReset();
    rememberLastDocumentPath.mockReset();
    rememberLastDocumentPath.mockReturnValue(["/tmp/story.fable"]);
    useAppStore.setState({
      activeDocument: null,
      mode: "navigation",
      notice: null,
      screen: "startup",
    });
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    document.body.innerHTML = "";
  });

  it("opens a new document directly in editing mode", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    promptForNewDocument.mockResolvedValue({
      documentId: "doc-1",
      layerCount: 1,
      name: "Story",
      openedAtMs: 1,
      path: "/tmp/story.fable",
    });

    await act(async () => {
      root.render(<StartupPanel />);
    });

    const row = Array.from(container.querySelectorAll("button")).find((node) =>
      node.textContent?.includes("New Document"),
    ) as HTMLButtonElement | undefined;

    await act(async () => {
      row?.click();
    });

    expect(useAppStore.getState().mode).toBe("editing");
    expect(useAppStore.getState().screen).toBe("workspace");

    await act(async () => {
      root.unmount();
    });
  });

  it("opens a recent-files panel from the main menu", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StartupPanel
          onOpenRecentDocument={() => {}}
          recentDocumentPaths={["/tmp/novel-draft.fable", "/tmp/essay-plan.fable"]}
        />,
      );
    });

    expect(container.textContent).toContain("Open Recent");
    expect(container.textContent).not.toContain("novel-draft");

    const openRecent = Array.from(container.querySelectorAll("button")).find((node) =>
      node.textContent?.includes("Open Recent"),
    ) as HTMLButtonElement;

    await act(async () => {
      openRecent.click();
    });

    expect(container.textContent).toContain("Previously Visited .fable Files");
    expect(container.textContent).toContain("novel-draft");
    expect(container.textContent).toContain("essay-plan");
    expect(container.textContent).toContain("Back");

    await act(async () => {
      root.unmount();
    });
  });

  it("shows getting started as a startup action", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<StartupPanel onOpenGettingStarted={() => {}} />);
    });

    expect(container.textContent).toContain("Getting Started");

    await act(async () => {
      root.unmount();
    });
  });

  it("moves focus through startup actions with arrow keys", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StartupPanel
          onOpenGettingStarted={() => {}}
          onOpenRecentDocument={() => {}}
          recentDocumentPaths={["/tmp/novel-draft.fable"]}
        />,
      );
    });

    const rows = Array.from(container.querySelectorAll("button"));
    expect(document.activeElement).toBe(rows[0]);

    await act(async () => {
      rows[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    });

    expect(document.activeElement).toBe(rows[1]);

    await act(async () => {
      rows[1].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));
    });

    expect(document.activeElement).toBe(rows[0]);

    await act(async () => {
      root.unmount();
    });
  });

  it("returns from recent files with escape", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StartupPanel
          onOpenRecentDocument={() => {}}
          recentDocumentPaths={["/tmp/novel-draft.fable", "/tmp/essay-plan.fable"]}
        />,
      );
    });

    const openRecent = Array.from(container.querySelectorAll("button")).find((node) =>
      node.textContent?.includes("Open Recent"),
    ) as HTMLButtonElement;

    await act(async () => {
      openRecent.click();
    });

    const recentRows = Array.from(container.querySelectorAll("button"));

    await act(async () => {
      recentRows[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });

    expect(container.textContent).toContain("Open Recent");
    expect(container.textContent).not.toContain("Back");

    await act(async () => {
      root.unmount();
    });
  });
});
