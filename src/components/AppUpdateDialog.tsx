import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { OverlayShell } from "./OverlayShell";
import type { AppUpdate, AppUpdateProgress } from "../storage/appUpdater";

type AppUpdateDialogStatus = "available" | "downloading" | "installing" | "error";

interface AppUpdateDialogProps {
  errorMessage: string | null;
  onClose: () => void;
  onInstall: () => void;
  progress: AppUpdateProgress | null;
  status: AppUpdateDialogStatus;
  update: AppUpdate | null;
}

export function AppUpdateDialog({
  errorMessage,
  onClose,
  onInstall,
  progress,
  status,
  update,
}: AppUpdateDialogProps) {
  const installButtonRef = useRef<HTMLButtonElement>(null);
  const canClose = status === "available" || status === "error";
  const isInstalling = status === "downloading" || status === "installing";

  useEffect(() => {
    installButtonRef.current?.focus();
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();

    if (event.key === "Escape" && canClose) {
      event.preventDefault();
      onClose();
    }
  }

  const versionLabel = update ? `Fablecraft ${update.version}` : "Fablecraft";
  const progressLabel =
    progress?.percent !== null && progress?.percent !== undefined
      ? `${progress.percent}%`
      : "Downloading";

  return (
    <OverlayShell
      footer={canClose ? "Escape closes this panel." : "Fablecraft will restart when installation finishes."}
      onBackdropMouseDown={canClose ? onClose : undefined}
      onPanelKeyDown={handleKeyDown}
      title={status === "error" ? "Update Failed" : "Update Available"}
      widthClassName="max-w-[min(92vw,520px)]"
    >
      <div className="flex flex-col gap-5 py-2">
        {status === "error" ? (
          <p className="text-sm leading-6 text-[var(--fc-color-text)]">
            {errorMessage ?? "Fablecraft could not install the update."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-base text-[var(--fc-color-text)]">
                {versionLabel} is ready to install.
              </p>
              {update?.body ? (
                <p className="text-sm leading-6 text-[var(--fc-color-muted)]">
                  {update.body}
                </p>
              ) : null}
            </div>

            {isInstalling ? (
              <div className="flex flex-col gap-2">
                <div
                  aria-label="Update download progress"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={progress?.percent ?? undefined}
                  className="h-1.5 w-full bg-[rgba(23,20,18,0.12)]"
                  role="progressbar"
                >
                  <div
                    className="h-full bg-[var(--fc-color-text)] transition-[width] duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
                    style={{ width: `${progress?.percent ?? 8}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--fc-color-muted)]">
                  {status === "installing" ? "Installing" : progressLabel}
                </p>
              </div>
            ) : null}
          </>
        )}

        <div className="flex justify-end gap-3">
          {canClose ? (
            <button
              className="px-4 py-2 text-sm text-[var(--fc-color-muted)] hover:text-[var(--fc-color-text)]"
              onClick={onClose}
              type="button"
            >
              {status === "error" ? "Close" : "Later"}
            </button>
          ) : null}

          {status === "available" ? (
            <button
              className="bg-[var(--fc-color-text)] px-4 py-2 text-sm text-[var(--fc-color-surface)] hover:opacity-80"
              onClick={onInstall}
              ref={installButtonRef}
              type="button"
            >
              Install and Restart
            </button>
          ) : null}
        </div>
      </div>
    </OverlayShell>
  );
}
