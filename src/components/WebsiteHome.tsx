import { siteDownloads, siteVersion } from "../site/siteContent";
import "../styles/website.css";

export function WebsiteHome() {
  const macDownload = siteDownloads.find((d) => d.platform === "macOS");

  return (
    <div className="fc-site">
      <div className="fc-site-shell">
        <header className="fc-site-nav">
          <a
            className="fc-site-wordmark"
            href="#top"
          >
            fc/
          </a>
          <span className="fc-site-version">v{siteVersion}</span>
        </header>

        <main>
          <section
            className="fc-site-section fc-hero"
            id="top"
          >
            <div className="fc-hero-copy">
              <h1>fablecraft</h1>
              <p className="fc-hero-slogan">The Writers Tool for Structured Thought.</p>
              <div className="fc-hero-rule" />
              <p className="fc-hero-summary">
                A local-first editor for writers who think in structure before prose.
              </p>
              <div className="fc-site-actions">
                {macDownload?.url ? (
                  <a
                    className="fc-site-action fc-site-action-primary"
                    href={macDownload.url}
                  >
                    Download preview
                  </a>
                ) : (
                  <span
                    aria-disabled
                    className="fc-site-action fc-site-action-muted"
                  >
                    Download preview
                  </span>
                )}
              </div>
            </div>
          </section>

          <section
            className="fc-site-section fc-demo-section"
            id="preview"
            aria-labelledby="fc-demo-heading"
          >
            <div className="fc-section-heading">
              <p className="fc-site-kicker">Editor</p>
              <h2 id="fc-demo-heading">Organize your ideas</h2>
            </div>
            <figure className="fc-demo-figure">
              <img
                alt="Fablecraft desktop workspace: sideways tree of cards with the active card centered."
                className="fc-demo-shot"
                data-testid="site-product-screenshot"
                decoding="async"
                height={1544}
                loading="lazy"
                src="/screenshot.png"
                width={2632}
              />
            </figure>
          </section>
        </main>

        <footer className="fc-site-footer">
          <p>Fablecraft</p>
          <p>The Writers Tool for Structured Thought.</p>
          <a href="#top">Back to top</a>
        </footer>
      </div>
    </div>
  );
}
