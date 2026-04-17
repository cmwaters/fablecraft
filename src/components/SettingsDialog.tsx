import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { OverlayShell } from "./OverlayShell";
import { useSettingsStore } from "../state/settingsStore";

interface SettingsDialogProps {
  onClose: () => void;
}

function SettingGroup<T extends string>({
  id,
  label,
  options,
  onChange,
  onFocusNext,
  onFocusPrevious,
  rowRef,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: T) => void;
  options: Array<{
    label: string;
    value: T;
  }>;
  onFocusNext: () => void;
  onFocusPrevious: () => void;
  rowRef: (element: HTMLDivElement | null) => void;
  value: T;
}) {
  const labelId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  function handleRowKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const movePrevious = event.key === "ArrowLeft";
    const moveNext = event.key === "ArrowRight";
    const moveRowPrevious = event.key === "ArrowUp";
    const moveRowNext = event.key === "ArrowDown";
    const moveHome = event.key === "Home";
    const moveEnd = event.key === "End";

    if (moveRowPrevious || moveRowNext) {
      event.preventDefault();
      event.stopPropagation();

      if (moveRowPrevious) {
        onFocusPrevious();
      } else {
        onFocusNext();
      }

      return;
    }

    if (!movePrevious && !moveNext && !moveHome && !moveEnd) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextIndex = moveHome
      ? 0
      : moveEnd
        ? options.length - 1
        : movePrevious
          ? (selectedIndex - 1 + options.length) % options.length
          : (selectedIndex + 1) % options.length;

    onChange(options[nextIndex]!.value);
  }

  return (
    <section
      aria-labelledby={labelId}
      className="group bg-[var(--fc-color-surface-strong)] px-5 py-4 shadow-[var(--fc-shadow-soft)] outline-none transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] focus:shadow-[var(--fc-shadow-elevated)] focus-visible:shadow-[var(--fc-shadow-elevated)]"
      data-testid={`setting-row-${id}`}
      onClickCapture={(event) => {
        (event.currentTarget as HTMLDivElement).focus();
      }}
      onKeyDown={handleRowKeyDown}
      ref={rowRef}
      tabIndex={0}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex w-3 justify-center font-[var(--fc-font-ui)] text-xs font-semibold text-[var(--fc-color-text)] opacity-0 transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] group-focus-within:opacity-100"
          >
            &gt;
          </span>
          <div
            className="font-[var(--fc-font-ui)] text-xs uppercase tracking-[0.18em] text-[var(--fc-color-muted)]"
            id={labelId}
          >
            {label}
          </div>
        </div>
        <div
          className="relative inline-flex min-w-[320px] rounded-full p-1 sm:justify-end"
          style={{
            boxShadow: "inset 0 0 0 1.5px rgba(23, 20, 18, 0.16)",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute bottom-1 top-1 rounded-full bg-[var(--fc-color-surface)] shadow-[var(--fc-shadow-soft)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
            style={{
              left: selectedIndex === 0 ? "4px" : "calc(50% + 2px)",
              width: "calc(50% - 6px)",
            }}
          />
          {options.map((option, index) => {
            const isActive = option.value === value;

            return (
              <button
                aria-pressed={isActive}
                className="relative z-[1] flex flex-1 items-center justify-center gap-3 rounded-full px-4 py-2.5 text-left transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                key={option.value}
                onClick={() => onChange(option.value)}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                tabIndex={-1}
                type="button"
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="relative inline-flex h-8 w-[58px] shrink-0 items-center rounded-full"
                    style={{
                      boxShadow: "inset 0 0 0 2px var(--fc-color-text)",
                    }}
                  >
                    <span
                      className="absolute h-3.5 w-[2px] rounded-full bg-[var(--fc-color-text)]"
                      style={{
                        left: index === 0 ? "12px" : "42px",
                      }}
                    />
                    <span
                      className="absolute h-3.5 w-3.5 rounded-full bg-[var(--fc-color-text)]"
                      style={{
                        left: index === 0 ? "36px" : "10px",
                      }}
                    />
                  </span>
                ) : null}
                <span className="text-[length:var(--fc-content-size)] leading-[1.3] text-[var(--fc-color-text)]">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const preferences = useSettingsStore((state) => state.preferences);
  const resetPreferences = useSettingsStore((state) => state.resetPreferences);
  const setCardWidth = useSettingsStore((state) => state.setCardWidth);
  const setFont = useSettingsStore((state) => state.setFont);
  const setLineHeight = useSettingsStore((state) => state.setLineHeight);
  const setScrollPan = useSettingsStore((state) => state.setScrollPan);
  const setTextSize = useSettingsStore((state) => state.setTextSize);
  const setTheme = useSettingsStore((state) => state.setTheme);

  function focusRow(index: number) {
    const nextIndex = (index + 6) % 6;
    rowRefs.current[nextIndex]?.focus();
  }

  useEffect(() => {
    rowRefs.current[0]?.focus();
  }, []);

  return (
    <OverlayShell
      footer="These controls update the global UI tokens immediately for the current machine."
      onPanelKeyDown={(event) => {
        event.stopPropagation();
      }}
      title="Settings"
      widthClassName="max-w-[min(92vw,760px)]"
    >
      <div className="flex flex-col gap-3">
        <SettingGroup
          id="theme"
          label="Theme"
          onChange={setTheme}
          onFocusNext={() => focusRow(1)}
          onFocusPrevious={() => focusRow(-1)}
          options={[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ]}
          rowRef={(element) => {
            rowRefs.current[0] = element;
          }}
          value={preferences.theme}
        />
        <SettingGroup
          id="font"
          label="Font"
          onChange={setFont}
          onFocusNext={() => focusRow(2)}
          onFocusPrevious={() => focusRow(0)}
          options={[
            { label: "Serif", value: "serif" },
            { label: "Sans", value: "sans" },
          ]}
          rowRef={(element) => {
            rowRefs.current[1] = element;
          }}
          value={preferences.font}
        />
        <SettingGroup
          id="text-size"
          label="Text Size"
          onChange={setTextSize}
          onFocusNext={() => focusRow(3)}
          onFocusPrevious={() => focusRow(1)}
          options={[
            { label: "Comfortable", value: "comfortable" },
            { label: "Large", value: "large" },
          ]}
          rowRef={(element) => {
            rowRefs.current[2] = element;
          }}
          value={preferences.textSize}
        />
        <SettingGroup
          id="line-height"
          label="Line Height"
          onChange={setLineHeight}
          onFocusNext={() => focusRow(4)}
          onFocusPrevious={() => focusRow(2)}
          options={[
            { label: "Compact", value: "compact" },
            { label: "Relaxed", value: "relaxed" },
          ]}
          rowRef={(element) => {
            rowRefs.current[3] = element;
          }}
          value={preferences.lineHeight}
        />
        <SettingGroup
          id="card-width"
          label="Card Width"
          onChange={setCardWidth}
          onFocusNext={() => focusRow(5)}
          onFocusPrevious={() => focusRow(3)}
          options={[
            { label: "Standard", value: "standard" },
            { label: "Wide", value: "wide" },
          ]}
          rowRef={(element) => {
            rowRefs.current[4] = element;
          }}
          value={preferences.cardWidth}
        />
        <SettingGroup
          id="scroll-pan"
          label="Trackpad Pan"
          onChange={setScrollPan}
          onFocusNext={() => focusRow(0)}
          onFocusPrevious={() => focusRow(4)}
          options={[
            { label: "Enabled", value: "enabled" },
            { label: "Disabled", value: "disabled" },
          ]}
          rowRef={(element) => {
            rowRefs.current[5] = element;
          }}
          value={preferences.scrollPan}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          className="rounded-full px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-text)] shadow-[inset_0_0_0_1.5px_rgba(23,20,18,0.16)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:shadow-[inset_0_0_0_1.5px_rgba(23,20,18,0.32)]"
          onClick={resetPreferences}
          type="button"
        >
          Reset
        </button>

        <button
          className="rounded-full bg-[var(--fc-color-text)] px-4 py-2 font-[var(--fc-font-ui)] text-sm text-[var(--fc-color-on-dark)] shadow-[var(--fc-shadow-soft)] transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)] hover:-translate-y-[1px]"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </OverlayShell>
  );
}
