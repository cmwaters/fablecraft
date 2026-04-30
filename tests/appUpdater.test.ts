import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DownloadEvent } from "@tauri-apps/plugin-updater";

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  isTauri: vi.fn(),
  relaunch: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: mocks.isTauri,
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: mocks.relaunch,
}));

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: mocks.check,
}));

import {
  checkForAppUpdate,
  installAppUpdate,
  progressFromDownloadEvent,
  type AppUpdateProgress,
} from "../src/storage/appUpdater";

describe("app updater", () => {
  beforeEach(() => {
    mocks.check.mockReset();
    mocks.isTauri.mockReset();
    mocks.relaunch.mockReset();
  });

  it("does not check for updates outside Tauri", async () => {
    mocks.isTauri.mockReturnValue(false);

    await expect(checkForAppUpdate()).resolves.toBeNull();
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it("normalizes an available Tauri update", async () => {
    const update = {
      body: "Release notes",
      currentVersion: "0.1.3",
      date: "2026-04-30T10:03:53Z",
      version: "0.1.4",
    };
    mocks.isTauri.mockReturnValue(true);
    mocks.check.mockResolvedValue(update);

    await expect(checkForAppUpdate()).resolves.toMatchObject({
      body: "Release notes",
      currentVersion: "0.1.3",
      date: "2026-04-30T10:03:53Z",
      version: "0.1.4",
      update,
    });
  });

  it("calculates download progress from updater events", () => {
    let progress: AppUpdateProgress = {
      contentLength: null,
      downloaded: 0,
      percent: null,
    };

    progress = progressFromDownloadEvent(progress, {
      event: "Started",
      data: { contentLength: 100 },
    });
    progress = progressFromDownloadEvent(progress, {
      event: "Progress",
      data: { chunkLength: 25 },
    });
    progress = progressFromDownloadEvent(progress, {
      event: "Progress",
      data: { chunkLength: 25 },
    });

    expect(progress).toEqual({
      contentLength: 100,
      downloaded: 50,
      percent: 50,
    });
  });

  it("downloads, installs, then relaunches", async () => {
    const events: DownloadEvent[] = [
      { event: "Started", data: { contentLength: 10 } },
      { event: "Progress", data: { chunkLength: 10 } },
      { event: "Finished" },
    ];
    const update = {
      downloadAndInstall: vi.fn(async (onEvent: (event: DownloadEvent) => void) => {
        events.forEach(onEvent);
      }),
    };
    const onProgress = vi.fn();

    await installAppUpdate(
      {
        body: null,
        currentVersion: "0.1.3",
        date: null,
        update: update as never,
        version: "0.1.4",
      },
      onProgress,
    );

    expect(update.downloadAndInstall).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenLastCalledWith({
      contentLength: 10,
      downloaded: 10,
      percent: 100,
    });
    expect(mocks.relaunch).toHaveBeenCalledTimes(1);
  });
});
