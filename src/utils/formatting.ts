export function truncateHash(hash: string, length: number = 16): string {
  if (hash.length <= length) {
    return hash;
  }
  return hash.slice(0, length) + "...";
}

export function truncateRev(rev: string, length: number = 7): string {
  if (rev.length <= length) {
    return rev;
  }
  return rev.slice(0, length);
}

export function formatGitHubUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  return url;
}
