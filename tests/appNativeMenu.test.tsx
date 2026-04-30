import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/app/App";
import { useAppStore } from "../src/state/appStore";
import type { NativeMenuAction } from "../src/lib/nativeMenu";

const mocks = vi.hoisted(() => ({
  enableClaudeDesktopIntegration: vi.fn(),
  enableCodexIntegration: vi.fn(),
  forceSaveCurrentDocument: vi.fn(),
  listen: vi.fn(),
  loadLocalIntegrationStatuses: vi.fn(),
  promptForNewDocument: vi.fn(),
  promptForOpenDocument: vi.fn(),
  unlisten: vi.fn(),
}));

let nativeMenuCallback:
  | ((event: { payload: { action: NativeMenuAction } }) => void)
  | null = null;

vi.mock("@tauri-apps/api/event", () => ({
  listen: mocks.listen,
}));

vi.mock("../src/app/documentActions", () => ({
  promptForNewDocument: () => mocks.promptForNewDocument(),
  promptForOpenDocument: () => mocks.promptForOpenDocument(),
}));

vi.mock("../src/storage/integrations", () => ({
  enableClaudeDesktopIntegration: () => mocks.enableClaudeDesktopIntegration(),
  enableCodexIntegration: () => mocks.enableCodexIntegration(),
  loadLocalIntegrationStatuses: () => mocks.loadLocalIntegrationStatuses(),
}));

vi.mock("../src/storage/forceSave", () => ({
  forceSaveCurrentDocument: () => mocks.forceSaveCurrentDocument(),
}));

vi.mock("../src/components/DocumentWorkspace", () => ({
  DocumentWorkspace: () => <div data-testid="document-workspace" />,
}));

vi.mock("../src/components/FeedbackDialog", () => ({
  FeedbackDialog: () => <div />,
}));

vi.mock("../src/components/HelpSheet", () => ({
  HelpSheet: () => <div />,
}));

vi.mock("../src/components/SearchOverlay", () => ({
  SearchOverlay: () => <div />,
}));

vi.mock("../src/components/SettingsDialog", () => ({
  SettingsDialog: () => <div />,
}));

function dispatchNativeMenuAction(action: NativeMenuAction) {
  nativeMenuCallback?.({ payload: { action } });
}

function resetAppStore() {
  useAppStore.setState({
    activeDocument: null,
    mode: "navigation",
    notice: null,
    screen: "startup",
  });
}

describe("App native menu handling", () => {
  const originalActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    nativeMenuCallback = null;
    mocks.enableClaudeDesktopIntegration.mockReset();
    mocks.enableCodexIntegration.mockReset();
    mocks.forceSaveCurrentDocument.mockReset();
    mocks.listen.mockReset();
    mocks.loadLocalIntegrationStatuses.mockReset();
    mocks.promptForNewDocument.mockReset();
    mocks.promptForOpenDocument.mockReset();
    mocks.unlisten.mockReset();
    mocks.listen.mockImplementation(
      async (
        _eventName: string,
        callback: (event: { payload: { action: NativeMenuAction } }) => void,
      ) => {
        nativeMenuCallback = callback;

        return mocks.unlisten;
      },
    );
    mocks.loadLocalIntegrationStatuses.mockResolvedValue({
      claudeDesktop: {
        binaryExists: false,
        binaryPath: null,
        configPath: "",
        enabled: false,
      },
      codex: {
        binaryExists: false,
        binaryPath: null,
        configPath: "",
        enabled: false,
      },
    });
    mocks.forceSaveCurrentDocument.mockResolvedValue(null);
    resetAppStore();
  });

  afterEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    document.body.innerHTML = "";
    resetAppStore();
  });

  it("keeps one native menu listener after opening a document", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    mocks.promptForOpenDocument.mockResolvedValue({
      documentId: "doc-1",
      name: "Story",
      openedAtMs: 1,
      path: "/tmp/story.fable",
    });

    await act(async () => {
      root.render(<App />);
    });

    expect(mocks.listen).toHaveBeenCalledTimes(1);

    await act(async () => {
      dispatchNativeMenuAction("open-document");
    });

    expect(
      mocks.forceSaveCurrentDocument.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.promptForOpenDocument.mock.invocationCallOrder[0]);
    expect(useAppStore.getState().screen).toBe("workspace");
    expect(mocks.listen).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it("force saves before creating a new document", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    mocks.promptForNewDocument.mockResolvedValue({
      documentId: "doc-2",
      name: "New Story",
      openedAtMs: 2,
      path: "/tmp/new-story.fable",
    });

    await act(async () => {
      root.render(<App />);
    });

    await act(async () => {
      dispatchNativeMenuAction("new-document");
    });

    expect(
      mocks.forceSaveCurrentDocument.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.promptForNewDocument.mock.invocationCallOrder[0]);
    expect(useAppStore.getState().activeDocument?.documentId).toBe("doc-2");

    await act(async () => {
      root.unmount();
    });
  });

  it("force saves when Cmd+S is pressed", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    await act(async () => {
      useAppStore.setState({
        activeDocument: {
          documentId: "doc-1",
          name: "Story",
          openedAtMs: 1,
          path: "/tmp/story.fable",
        },
        mode: "navigation",
        notice: null,
        screen: "workspace",
      });
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "s",
          metaKey: true,
        }),
      );
    });

    expect(mocks.forceSaveCurrentDocument).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it("ignores duplicate open-document events while the picker is pending", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let resolveOpenDocument:
      | ((document: {
          documentId: string;
          name: string;
          openedAtMs: number;
          path: string;
        }) => void)
      | null = null;

    mocks.promptForOpenDocument.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOpenDocument = resolve;
        }),
    );

    await act(async () => {
      root.render(<App />);
    });

    await act(async () => {
      dispatchNativeMenuAction("open-document");
      dispatchNativeMenuAction("open-document");
    });

    expect(mocks.promptForOpenDocument).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveOpenDocument?.({
        documentId: "doc-1",
        name: "Story",
        openedAtMs: 1,
        path: "/tmp/story.fable",
      });
    });

    await act(async () => {
      root.unmount();
    });
  });
});
