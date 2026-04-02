import { Suspense, lazy } from "react";
import { detectAppRuntime } from "./runtime";

const DesktopApp = lazy(async () => {
  const module = await import("./App");

  return { default: module.App };
});

const WebsiteHome = lazy(async () => {
  const module = await import("../components/WebsiteHome");

  return { default: module.WebsiteHome };
});

export function RootApp() {
  const runtime = detectAppRuntime();

  return (
    <Suspense fallback={null}>
      {runtime === "desktop" ? <DesktopApp /> : <WebsiteHome />}
    </Suspense>
  );
}
