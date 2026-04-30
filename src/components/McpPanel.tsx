import { useEffect, useMemo, useState } from "react";
import { OverlayShell } from "./OverlayShell";
import { invokeMcpTool, listMcpTools } from "../storage/mcp";
import type { DocumentSnapshot } from "../domain/document/types";
import type { McpToolDefinition, McpToolScope } from "../types/mcp";

interface McpPanelProps {
  activeCardId: string | null;
  onApplySnapshot: (snapshot: DocumentSnapshot) => void;
  onClose: () => void;
}

function defaultArguments(tool: McpToolDefinition | null) {
  return tool?.inputExample ?? "{}";
}

export function McpPanel({
  activeCardId,
  onApplySnapshot,
  onClose,
}: McpPanelProps) {
  const [tools, setTools] = useState<McpToolDefinition[]>([]);
  const [selectedToolName, setSelectedToolName] = useState<string | null>(null);
  const [scope, setScope] = useState<McpToolScope>("card");
  const [argumentsJson, setArgumentsJson] = useState("{}");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRunning, setRunning] = useState(false);
  const [resultJson, setResultJson] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      setLoading(true);

      try {
        const loadedTools = await listMcpTools();

        if (isCancelled) {
          return;
        }

        setTools(loadedTools);
        setSelectedToolName((current) => current ?? loadedTools[0]?.name ?? null);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Fablecraft could not load MCP tools.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, []);

  const visibleTools = useMemo(
    () =>
      tools.filter((tool) => tool.scope === "document" || tool.scope === scope),
    [scope, tools],
  );
  const selectedTool =
    visibleTools.find((tool) => tool.name === selectedToolName) ?? visibleTools[0] ?? null;

  useEffect(() => {
    if (!selectedTool) {
      setSelectedToolName(null);
      setArgumentsJson("{}");
      return;
    }

    if (selectedTool.name !== selectedToolName) {
      setSelectedToolName(selectedTool.name);
    }

    setArgumentsJson(defaultArguments(selectedTool));
  }, [selectedTool, selectedToolName]);

  async function handleRunTool() {
    if (!selectedTool) {
      return;
    }

    setRunning(true);
    setErrorMessage(null);

    try {
      const response = await invokeMcpTool({
        argumentsJson,
        cardId: activeCardId,
        scope,
        toolName: selectedTool.name,
      });

      if (response.snapshot) {
        onApplySnapshot(response.snapshot);
      }

      setResultJson(response.resultJson);
      setSummary(response.summary);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Fablecraft could not run that MCP tool.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function handleCopyResult() {
    if (!resultJson || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resultJson);
      setSummary("Copied the MCP result to the clipboard.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Fablecraft could not copy the MCP result.",
      );
    }
  }

  return (
    <OverlayShell
      footer="Escape closes this panel. Payloads above the local MCP limit return structured errors."
      onBackdropMouseDown={onClose}
      title="MCP"
      widthClassName="max-w-[min(96vw,980px)]"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-[var(--fc-color-border)] bg-[var(--fc-color-surface-strong)] p-1">
            {(["card", "subtree"] as const).map((nextScope) => {
              const isActive = nextScope === scope;

              return (
                <button
                  className="rounded-full px-4 py-2 font-[var(--fc-font-ui)] text-sm transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                  key={nextScope}
                  onClick={() => setScope(nextScope)}
                  style={{
                    backgroundColor: isActive
                      ? "var(--fc-color-surface)"
                      : "transparent",
                    borderColor: "transparent",
                    color: "var(--fc-color-text)",
                  }}
                  type="button"
                >
                  {nextScope === "card" ? "Card scope" : "Subtree scope"}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-[var(--fc-color-muted)]">
            Tools use the same argument payload as external MCP clients.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-auto rounded-[24px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface-strong)] p-2">
            {isLoading ? (
              <p className="px-3 py-4 text-sm text-[var(--fc-color-muted)]">
                Loading MCP tools…
              </p>
            ) : (
              visibleTools.map((tool) => {
                const isActive = tool.name === selectedTool?.name;

                return (
                  <button
                    className="rounded-[18px] border px-3 py-3 text-left transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                    key={tool.name}
                    onClick={() => {
                      setSelectedToolName(tool.name);
                      setArgumentsJson(tool.inputExample);
                      setErrorMessage(null);
                    }}
                    style={{
                      backgroundColor: isActive
                        ? "var(--fc-color-surface)"
                        : "transparent",
                      borderColor: isActive
                        ? "var(--fc-color-border-strong)"
                        : "transparent",
                    }}
                    type="button"
                  >
                    <p className="font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-text)]">
                      {tool.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--fc-color-muted)]">
                      {tool.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex min-h-[60vh] flex-col gap-4 rounded-[24px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface-strong)] p-4">
            <div>
              <p className="font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-muted)]">
                {selectedTool?.isMutation ? "Mutation tool" : "Read tool"}
              </p>
              <h3 className="mt-1 font-[var(--fc-font-content)] text-2xl text-[var(--fc-color-text)]">
                {selectedTool?.name ?? "No MCP tool"}
              </h3>
              <p className="mt-2 text-base leading-7 text-[var(--fc-color-muted)]">
                {selectedTool?.description ??
                  "Select a tool to inspect its arguments and result."}
              </p>
            </div>

            <label className="flex flex-1 flex-col gap-2">
              <span className="font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-muted)]">
                Arguments JSON
              </span>
              <textarea
                className="min-h-[180px] w-full flex-1 rounded-[22px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface)] px-4 py-3 font-mono text-sm leading-6 text-[var(--fc-color-text)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:border-[var(--fc-color-border-strong)]"
                onChange={(event) => setArgumentsJson(event.target.value)}
                spellCheck={false}
                value={argumentsJson}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-[18px] border border-[var(--fc-color-border-strong)] bg-[var(--fc-color-text)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-on-dark)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-50"
                disabled={!selectedTool || isLoading || isRunning}
                onClick={() => {
                  void handleRunTool();
                }}
                type="button"
              >
                {isRunning ? "Running…" : "Run tool"}
              </button>

              <button
                className="rounded-[18px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-text)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-50"
                disabled={!resultJson}
                onClick={() => {
                  void handleCopyResult();
                }}
                type="button"
              >
                Copy result
              </button>
            </div>

            {summary ? (
              <p className="rounded-[20px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface)] px-4 py-3 text-sm text-[var(--fc-color-text)]">
                {summary}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-[20px] border border-[var(--fc-color-border-strong)] bg-[var(--fc-color-surface)] px-4 py-3 text-sm text-[var(--fc-color-text)]">
                {errorMessage}
              </p>
            ) : null}

            <div className="min-h-[220px] rounded-[22px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface)] p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[var(--fc-color-text)]">
                {resultJson || "Run a tool to inspect its JSON result here."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </OverlayShell>
  );
}
