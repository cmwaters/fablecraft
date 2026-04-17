import { useEffect, useRef, useState } from "react";
import { siteFeedbackEndpoints, siteVersion } from "../site/siteContent";
import { OverlayShell } from "./OverlayShell";

export type FeedbackDialogMode = "bug" | "feature";

interface FeedbackDialogProps {
  mode: FeedbackDialogMode;
  onClose: () => void;
}

export function FeedbackDialog({ mode, onClose }: FeedbackDialogProps) {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBug = mode === "bug";
  const title = isBug ? "Report a Bug" : "Request a Feature";
  const placeholder = isBug
    ? "Describe what went wrong. What were you doing, and what did you expect to happen?"
    : "Describe the feature you'd like. What problem would it solve?";
  const endpoint = siteFeedbackEndpoints.feedbackUrl;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit() {
    if (!description.trim() || status === "submitting") {
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          description: description.trim(),
          version: siteVersion,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}.`);
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  if (status === "success") {
    return (
      <OverlayShell title={title} onBackdropMouseDown={onClose}>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-[var(--fc-color-text)]">
            {isBug
              ? "Your bug report has been submitted. We'll look into it."
              : "Your feature request has been submitted. We'll consider it for a future release."}
          </p>
          <div className="flex justify-end">
            <button
              className="bg-[var(--fc-color-text)] px-4 py-2 text-sm text-[var(--fc-color-surface)] hover:opacity-80"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </OverlayShell>
    );
  }

  return (
    <OverlayShell
      title={title}
      onBackdropMouseDown={onClose}
      onPanelKeyDown={handleKeyDown}
      footer="Escape closes this panel."
    >
      <div className="flex flex-col gap-4 py-2">
        <textarea
          ref={textareaRef}
          className="w-full resize-none border border-[rgba(23,20,18,0.2)] bg-transparent p-3 text-sm text-[var(--fc-color-text)] placeholder:text-[var(--fc-color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--fc-color-text)]"
          disabled={status === "submitting"}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholder}
          rows={8}
          value={description}
        />
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm text-[var(--fc-color-muted)] hover:text-[var(--fc-color-text)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-[var(--fc-color-text)] px-4 py-2 text-sm text-[var(--fc-color-surface)] disabled:opacity-40 hover:opacity-80"
            disabled={!description.trim() || status === "submitting"}
            onClick={() => void handleSubmit()}
          >
            {status === "submitting" ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </OverlayShell>
  );
}
