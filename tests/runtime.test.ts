import { beforeEach, describe, expect, it, vi } from "vitest";

const { isTauriMock } = vi.hoisted(() => ({
  isTauriMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: isTauriMock,
}));

import { detectAppRuntime } from "../src/app/runtime";

describe("detectAppRuntime", () => {
  beforeEach(() => {
    isTauriMock.mockReset();
  });

  it("returns web outside Tauri", () => {
    isTauriMock.mockReturnValue(false);

    expect(detectAppRuntime()).toBe("web");
  });

  it("returns desktop inside Tauri", () => {
    isTauriMock.mockReturnValue(true);

    expect(detectAppRuntime()).toBe("desktop");
  });
});
