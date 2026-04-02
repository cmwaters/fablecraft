import { useEffect, useRef, useState } from "react";
import { OverlayShell } from "./OverlayShell";
import type { LayerRecord } from "../domain/document/types";

interface LayerDetailsDialogProps {
  focusField: "description" | "name";
  layer: LayerRecord;
  onClose: () => void;
  onDelete: (() => void) | null;
  onSave: (name: string, description: string) => void;
}

export function LayerDetailsDialog({
  focusField,
  layer,
  onClose,
  onDelete,
  onSave,
}: LayerDetailsDialogProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [name, setName] = useState(layer.name);
  const [description, setDescription] = useState(layer.description ?? "");

  useEffect(() => {
    if (focusField === "description") {
      descriptionInputRef.current?.focus();
      return;
    }

    nameInputRef.current?.focus();
  }, [focusField]);

  return (
    <OverlayShell
      footer="Use this dialog for both layer renaming and description edits."
      title="Layer Details"
      widthClassName="max-w-[min(92vw,640px)]"
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-[var(--fc-font-ui)] text-sm uppercase tracking-[0.18em] text-[var(--fc-color-muted)]">
            Name
          </span>
          <input
            className="rounded-[18px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface-strong)] px-4 py-3 text-base text-[var(--fc-color-text)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:border-[var(--fc-color-border-strong)]"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }

              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSave(name.trim() || layer.name, description.trim());
              }
            }}
            ref={nameInputRef}
            value={name}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-[var(--fc-font-ui)] text-sm uppercase tracking-[0.18em] text-[var(--fc-color-muted)]">
            Description
          </span>
          <textarea
            className="min-h-32 rounded-[18px] border border-[var(--fc-color-border)] bg-[var(--fc-color-surface-strong)] px-4 py-3 text-base leading-7 text-[var(--fc-color-text)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:border-[var(--fc-color-border-strong)]"
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
            }}
            ref={descriptionInputRef}
            value={description}
          />
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {onDelete ? (
          <button
            className="rounded-[18px] border border-[var(--fc-color-border)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-text)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:border-[var(--fc-color-border-strong)]"
            onClick={onDelete}
            type="button"
          >
            Delete layer
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          <button
            className="rounded-[18px] border border-[var(--fc-color-border)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-text)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:border-[var(--fc-color-border-strong)]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-[18px] border border-[var(--fc-color-border-strong)] bg-[var(--fc-color-text)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-on-dark)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:-translate-y-[1px]"
            onClick={() => onSave(name.trim() || layer.name, description.trim())}
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </OverlayShell>
  );
}
