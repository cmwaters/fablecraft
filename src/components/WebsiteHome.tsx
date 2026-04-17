import { lazy, Suspense } from "react";
import { siteDownloads, siteVersion } from "../site/siteContent";
import "../styles/website.css";

const DemoApp = lazy(async () => {
  const module = await import("./DemoApp");
  return { default: module.DemoApp };
});

function detectClientOS(): "mac" | "linux" | "windows" | "unknown" {
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform ?? "").toLowerCase();
  if (ua.includes("mac") || platform.includes("mac")) return "mac";
  if (ua.includes("linux") || platform.includes("linux")) return "linux";
  if (ua.includes("win") || platform.includes("win")) return "windows";
  return "unknown";
}

export function WebsiteHome() {
  const os = detectClientOS();
  const macDownload = siteDownloads.find((d) => d.platform === "macOS");
  const linuxDownload = siteDownloads.find((d) => d.platform === "Linux");

  const showMac = os === "mac" || os === "unknown";
  const showLinux = os === "linux" || os === "unknown";

  return (
    <div className="fc-site">
      <div className="fc-site-shell">
        <header className="fc-site-nav">
          <a className="fc-site-wordmark" href="#top">
            fc/
          </a>
          <span className="fc-site-version">v{siteVersion}</span>
        </header>

        <main>
          {/* Hero */}
          <section className="fc-site-section fc-hero" id="top">
            <div className="fc-hero-copy">
              <h1>fablecraft</h1>
              <div className="fc-hero-rule" />
              <p className="fc-hero-slogan">The Writers Tool for Structured Thought.</p>
              <div className="fc-site-actions">
                <a
                  className="fc-site-action"
                  href="#demo"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Try it out!
                </a>

                {showMac && (
                  macDownload?.url ? (
                    <a
                      className="fc-site-action fc-site-action-primary"
                      href={macDownload.url}
                    >
                      Download for macOS
                    </a>
                  ) : (
                    <span aria-disabled className="fc-site-action fc-site-action-muted">
                      macOS — coming soon
                    </span>
                  )
                )}

                {showLinux && (
                  linuxDownload?.url ? (
                    <a
                      className="fc-site-action fc-site-action-primary"
                      href={linuxDownload.url}
                    >
                      Download for Linux
                    </a>
                  ) : (
                    <span aria-disabled className="fc-site-action fc-site-action-muted">
                      Linux — coming soon
                    </span>
                  )
                )}
              </div>
            </div>
          </section>

          {/* Live Demo — the document itself is the feature tour */}
          <section className="fc-live-demo-section" id="demo">
            <div className="fc-demo-shell">
              <Suspense
                fallback={
                  <div className="fc-demo-loading">
                    Loading editor...
                  </div>
                }
              >
                <DemoApp />
              </Suspense>
            </div>
          </section>
        </main>

        {macDownload?.url ? (
          <a className="fc-site-footer" href={macDownload.url}>
            <p className="fc-site-footer-wordmark">fablecraft</p>
            <span className="fc-site-action fc-site-action-primary fc-site-footer-cta">
              Download for macOS
            </span>
          </a>
        ) : (
          <footer className="fc-site-footer">
            <p className="fc-site-footer-wordmark">fablecraft</p>
            <span aria-disabled className="fc-site-action fc-site-action-muted fc-site-footer-cta">
              macOS — coming soon
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
