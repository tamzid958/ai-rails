import { execSync } from "node:child_process";

export function getRepoFullName(): string | null {
  try {
    const url = execSync("git remote get-url origin", {
      encoding: "utf-8",
    }).trim();

    // SSH: git@github.com:org/repo.git
    const sshMatch = url.match(/:([^/]+\/[^/]+?)(?:\.git)?$/);
    if (sshMatch?.[1]) return sshMatch[1];

    // HTTPS: https://github.com/org/repo.git
    const httpsMatch = url.match(
      /(?:github\.com|gitlab\.com)\/([^/]+\/[^/]+?)(?:\.git)?$/,
    );
    if (httpsMatch?.[1]) return httpsMatch[1];

    return null;
  } catch {
    return null;
  }
}

export function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

export function getLastCommitHash(): string {
  return execSync("git rev-parse --short HEAD", {
    encoding: "utf-8",
  }).trim();
}
