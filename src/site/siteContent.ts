import packageJson from "../../package.json";

export interface SiteDownloadOption {
  availability: "available" | "soon";
  ctaLabel: string;
  description: string;
  platform: string;
  url: string | null;
}

export interface SiteReleaseNote {
  body: string;
  dateLabel: string;
  title: string;
  versionLabel: string;
}

export interface SiteFutureMilestone {
  detail: string;
  title: string;
}

export interface SiteFeedbackEndpointConfig {
  bugReportUrl: string | null;
  featureRequestUrl: string | null;
}

function readSiteEnv(name: string) {
  const value = (import.meta.env as Record<string, string | boolean | undefined>)[name];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export const siteVersion = packageJson.version;

export const siteContactEmail = readSiteEnv("VITE_FABLECRAFT_CONTACT_EMAIL");

// TODO: Replace env-driven placeholders with real hosted release assets and
// support destinations once the Vercel and Supabase deployment pipeline is chosen.
export const siteFeedbackEndpoints: SiteFeedbackEndpointConfig = {
  bugReportUrl: readSiteEnv("VITE_FABLECRAFT_BUG_REPORT_URL"),
  featureRequestUrl: readSiteEnv("VITE_FABLECRAFT_FEATURE_REQUEST_URL"),
};

export const siteDownloads: SiteDownloadOption[] = [
  {
    availability: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_MAC_URL") ? "available" : "soon",
    ctaLabel: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_MAC_URL")
      ? "Download for macOS"
      : "macOS link pending",
    description:
      "The primary desktop preview. Manual install and manual updates from the latest public build.",
    platform: "macOS",
    url: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_MAC_URL"),
  },
  {
    availability: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_WINDOWS_URL") ? "available" : "soon",
    ctaLabel: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_WINDOWS_URL")
      ? "Download for Windows"
      : "Windows build soon",
    description:
      "Planned once the public release pipeline is ready. Keep an eye on release notes for availability.",
    platform: "Windows",
    url: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_WINDOWS_URL"),
  },
  {
    availability: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_LINUX_URL") ? "available" : "soon",
    ctaLabel: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_LINUX_URL")
      ? "Download for Linux"
      : "Linux build soon",
    description:
      "Planned after the first public desktop release path is settled and documented.",
    platform: "Linux",
    url: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_LINUX_URL"),
  },
];

export const siteReleaseNotes: SiteReleaseNote[] = [
  {
    body:
      "The first public desktop preview brings the sideways writing workspace, command palette, search, import and export, and the local MCP surface into one local-first tool.",
    dateLabel: "2026.04",
    title: "First desktop preview",
    versionLabel: `v${siteVersion}`,
  },
  {
    body:
      "The public website becomes the new front door for downloads, release communication, bug reports, feature requests, and later account-backed sync and connector setup.",
    dateLabel: "2026.04",
    title: "Website launch surface",
    versionLabel: "stage two",
  },
];

export const siteFutureMilestones: SiteFutureMilestone[] = [
  {
    detail:
      "A later authenticated surface for managing account state, document sync, and release-aware updates without changing the local-first writing model.",
    title: "Sync",
  },
  {
    detail:
      "Hosted connector setup, permission screens, and status visibility for AI clients once the connector contract is explicitly defined.",
    title: "AI connectors",
  },
];
