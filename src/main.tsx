import React from "react";
import ReactDOM from "react-dom/client";
import { RootApp } from "./app/RootApp";
import { detectAppRuntime } from "./app/runtime";
import { loadStoredUiPreferences } from "./state/settingsStore";
import { applyUiTokens } from "./styles/tokens";
import "./styles/globals.css";

const runtime = detectAppRuntime();

document.documentElement.dataset.fcRuntime = runtime;
document.body.dataset.fcRuntime = runtime;
document.title =
  runtime === "desktop"
    ? "Fablecraft"
    : "Fablecraft — The Writers Tool for Structured Thought";

if (runtime === "desktop") {
  applyUiTokens(loadStoredUiPreferences());
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
