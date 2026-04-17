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
  feedbackUrl: string;
}

export interface SiteGithubReleaseConfig {
  assetName: string | null;
  owner: string | null;
  repo: string | null;
}

function readSiteEnv(name: string) {
  const value = (import.meta.env as Record<string, string | boolean | undefined>)[name];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildGithubLatestReleaseAssetUrl(config: SiteGithubReleaseConfig) {
  if (!config.owner || !config.repo || !config.assetName) {
    return null;
  }

  return `https://github.com/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/releases/latest/download/${encodeURIComponent(config.assetName)}`;
}

export const siteVersion = packageJson.version;

export const siteContactEmail = readSiteEnv("VITE_FABLECRAFT_CONTACT_EMAIL");

export const siteUrl = "https://fablecraft.xyz";

export const siteFeedbackEndpoints: SiteFeedbackEndpointConfig = {
  feedbackUrl: `${siteUrl}/api/feedback`,
};

const githubReleaseBase: Pick<SiteGithubReleaseConfig, "owner" | "repo"> = {
  owner: readSiteEnv("VITE_FABLECRAFT_GITHUB_OWNER"),
  repo: readSiteEnv("VITE_FABLECRAFT_GITHUB_REPO"),
};

const macDownloadUrl = buildGithubLatestReleaseAssetUrl({
  ...githubReleaseBase,
  assetName: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_MAC_ASSET_NAME"),
});

const linuxDownloadUrl = buildGithubLatestReleaseAssetUrl({
  ...githubReleaseBase,
  assetName: readSiteEnv("VITE_FABLECRAFT_DOWNLOAD_LINUX_ASSET_NAME"),
});

export const siteDownloads: SiteDownloadOption[] = [
  {
    availability: macDownloadUrl ? "available" : "soon",
    ctaLabel: macDownloadUrl ? "Download for macOS" : "macOS link pending",
    description:
      "The primary desktop preview, served from the latest public GitHub release as a macOS DMG.",
    platform: "macOS",
    url: macDownloadUrl,
  },
  {
    availability: linuxDownloadUrl ? "available" : "soon",
    ctaLabel: linuxDownloadUrl ? "Download for Linux" : "Linux build soon",
    description:
      "AppImage for x86_64 Linux, served from the latest public GitHub release.",
    platform: "Linux",
    url: linuxDownloadUrl,
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
