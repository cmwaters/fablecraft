import type { PropsWithChildren, ReactNode } from "react";

interface OverlayShellProps extends PropsWithChildren {
  onBackdropMouseDown?: () => void;
  footer?: ReactNode;
  onPanelKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  title?: string;
  widthClassName?: string;
}

export function OverlayShell({
  children,
  footer,
  onBackdropMouseDown,
  onPanelKeyDown,
  title,
  widthClassName = "max-w-[min(92vw,720px)]",
}: OverlayShellProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-[var(--fc-color-overlay-backdrop)] px-4 py-4 sm:px-6 sm:py-6"
      onMouseDown={() => onBackdropMouseDown?.()}
    >
      <div
        data-testid="overlay-panel"
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden bg-[var(--fc-color-surface)] shadow-[var(--fc-shadow-elevated)] sm:max-h-[calc(100vh-3rem)] ${widthClassName}`}
        onKeyDown={onPanelKeyDown}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {title ? (
          <div className="shrink-0">
            <div className="px-6 py-4">
              <h2 className="font-[var(--fc-font-content)] text-2xl text-[var(--fc-color-text)]">
                {title}
              </h2>
            </div>
            <div
              aria-hidden="true"
              className="h-px w-full"
              style={{
                backgroundColor: "rgba(23, 20, 18, 0.12)",
              }}
            />
          </div>
        ) : null}

        <div
          className="min-h-0 overflow-y-auto px-6 py-5"
          data-testid="overlay-content"
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 px-6 py-4 text-sm text-[var(--fc-color-muted)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
