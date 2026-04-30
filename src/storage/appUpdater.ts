import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";

const CHECK_TIMEOUT_MS = 15_000;
const INSTALL_TIMEOUT_MS = 120_000;

export interface AppUpdate {
  body: string | null;
  currentVersion: string;
  date: string | null;
  version: string;
  update: Update;
}

export interface AppUpdateProgress {
  contentLength: number | null;
  downloaded: number;
  percent: number | null;
}

export function progressFromDownloadEvent(
  currentProgress: AppUpdateProgress,
  event: DownloadEvent,
): AppUpdateProgress {
  if (event.event === "Started") {
    return {
      contentLength: event.data.contentLength ?? null,
      downloaded: 0,
      percent: null,
    };
  }

  if (event.event === "Progress") {
    const downloaded = currentProgress.downloaded + event.data.chunkLength;
    const percent =
      currentProgress.contentLength && currentProgress.contentLength > 0
        ? Math.min(100, Math.round((downloaded / currentProgress.contentLength) * 100))
        : null;

    return {
      ...currentProgress,
      downloaded,
      percent,
    };
  }

  return {
    ...currentProgress,
    percent: 100,
  };
}

export async function checkForAppUpdate(): Promise<AppUpdate | null> {
  if (!isTauri()) {
    return null;
  }

  const update = await check({ timeout: CHECK_TIMEOUT_MS });

  if (!update) {
    return null;
  }

  return {
    body: update.body ?? null,
    currentVersion: update.currentVersion,
    date: update.date ?? null,
    update,
    version: update.version,
  };
}

export async function installAppUpdate(
  appUpdate: AppUpdate,
  onProgress: (progress: AppUpdateProgress) => void,
) {
  let progress: AppUpdateProgress = {
    contentLength: null,
    downloaded: 0,
    percent: null,
  };

  await appUpdate.update.downloadAndInstall((event) => {
    progress = progressFromDownloadEvent(progress, event);
    onProgress(progress);
  }, { timeout: INSTALL_TIMEOUT_MS });

  await relaunch();
}
