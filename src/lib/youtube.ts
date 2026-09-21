/**
 * `v` busts the image optimizer's cache when a video's thumbnail is
 * replaced on YouTube (same video ID, new image) — otherwise the old
 * thumbnail can keep serving for hours from Vercel's edge cache.
 */
export function youtubeThumbnailUrl(videoId: string, updatedAt?: string): string {
  const base = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return updatedAt ? `${base}?v=${encodeURIComponent(updatedAt)}` : base;
}
