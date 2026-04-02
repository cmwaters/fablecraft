import { useEffect, useRef, useState } from "react";
import type { LayerColor } from "../domain/document/types";
import { layerBorderColor } from "../lib/layerStyles";

interface LayerCreationPanelProps {
  accentColor: LayerColor;
  nextIndex: number;
  onCancel: () => void;
  onCreate: (name: string, description: string | null) => void;
}

export function LayerCreationPanel({
  accentColor,
  nextIndex,
  onCancel,
  onCreate,
}: LayerCreationPanelProps) {
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function submit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    onCreate(trimmedName, description.trim() ? description.trim() : null);
  }

  return (
    <section
      className="mx-auto w-full max-w-[var(--fc-card-width)] rounded-[var(--fc-radius-card)] border bg-[var(--fc-color-surface)]/96 p-10 shadow-[var(--fc-shadow-card)] backdrop-blur"
      style={{ borderColor: layerBorderColor(accentColor) }}
    >
      <div className="grid gap-4">
        <label className="grid gap-2">
          <input
            className="rounded-2xl border bg-[var(--fc-color-app)]/70 px-4 py-3 text-base text-[var(--fc-color-text)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:shadow-[var(--fc-shadow-soft)]"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }

              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={`Layer ${nextIndex + 1} name`}
            ref={nameInputRef}
            style={{ borderColor: layerBorderColor(accentColor) }}
            value={name}
          />
        </label>

        <label className="grid gap-2">
          <input
            className="rounded-2xl border border-[var(--fc-color-border)] bg-[var(--fc-color-app)]/70 px-4 py-3 text-base text-[var(--fc-color-text)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:border-[var(--fc-color-border-strong)] focus:shadow-[var(--fc-shadow-soft)]"
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }

              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Description (optional)"
            value={description}
          />
        </label>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          className="rounded-2xl border px-5 py-3 text-sm text-[var(--fc-color-text)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:-translate-y-[1px]"
          onClick={submit}
          style={{
            backgroundColor: layerBorderColor(accentColor),
            borderColor: layerBorderColor(accentColor),
            color: "var(--fc-color-on-dark)",
          }}
          type="button"
        >
          Create and switch
        </button>

        <button
          className="rounded-2xl border border-[var(--fc-color-border)] px-5 py-3 text-sm text-[var(--fc-color-muted)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:border-[var(--fc-color-border-strong)] hover:text-[var(--fc-color-text)]"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
