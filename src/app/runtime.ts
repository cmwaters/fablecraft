import { isTauri } from "@tauri-apps/api/core";

export type FablecraftRuntime = "desktop" | "web";

export function detectAppRuntime(): FablecraftRuntime {
  return isTauri() ? "desktop" : "web";
}
