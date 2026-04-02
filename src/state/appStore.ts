import { create } from "zustand";
import type { DocumentSummary } from "../types/document";

export type AppScreen = "booting" | "startup" | "workspace";
export type AppMode = "navigation" | "editing" | "search" | "command";

export interface AppNotice {
  message: string;
  tone: "info" | "error";
}

interface AppState {
  activeDocument: DocumentSummary | null;
  mode: AppMode;
  notice: AppNotice | null;
  screen: AppScreen;
  setDocument: (document: DocumentSummary | null) => void;
  setMode: (mode: AppMode) => void;
  setNotice: (notice: AppNotice | null) => void;
  setScreen: (screen: AppScreen) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeDocument: null,
  mode: "navigation",
  notice: null,
  screen: "startup",
  setDocument: (document) =>
    set({
      activeDocument: document,
      screen: document ? "workspace" : "startup",
    }),
  setMode: (mode) => set({ mode }),
  setNotice: (notice) => set({ notice }),
  setScreen: (screen) => set({ screen }),
}));
