export const config = { runtime: "edge" };

const GITHUB_API = "https://api.github.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(message: string, status: number) {
  return new Response(message, { status, headers: CORS_HEADERS });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return err("Method Not Allowed", 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Bad Request: invalid JSON", 400);
  }

  if (typeof body !== "object" || body === null) {
    return err("Bad Request: expected an object", 400);
  }

  const { type, description, version } = body as Record<string, unknown>;

  if (type !== "bug" && type !== "feature") {
    return err('Bad Request: type must be "bug" or "feature"', 400);
  }

  if (typeof description !== "string" || !description.trim()) {
    return err("Bad Request: description is required", 400);
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER ?? "fablecraft-org";
  const repo = process.env.GITHUB_REPO ?? "fablecraft";

  if (!token) {
    console.error("GITHUB_TOKEN is not set");
    return err("Service Unavailable", 503);
  }

  const isBug = type === "bug";
  const prefix = isBug ? "[Bug]" : "[Feature]";
  const label = isBug ? "bug" : "enhancement";
  const title = `${prefix} ${description.trim().slice(0, 100)}${description.trim().length > 100 ? "…" : ""}`;
  const issueBody = [
    description.trim(),
    "",
    "---",
    `*Submitted via in-app feedback${typeof version === "string" && version ? ` · v${version}` : ""}*`,
  ].join("\n");

  const ghResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body: issueBody, labels: [label] }),
  });

  if (!ghResponse.ok) {
    const text = await ghResponse.text();
    console.error("GitHub API error:", ghResponse.status, text);
    return err("Failed to create issue", 502);
  }

  const issue = (await ghResponse.json()) as { html_url: string; number: number };

  return json({ issueNumber: issue.number, issueUrl: issue.html_url }, 201);
}
