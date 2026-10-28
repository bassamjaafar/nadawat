/**
 * `v` busts the image optimizer's cache when a video's thumbnail is
 * replaced on YouTube (same video ID, new image) — otherwise the old
 * thumbnail can keep serving for hours from Vercel's edge cache.
 */
export function youtubeThumbnailUrl(videoId: string, updatedAt?: string): string {
  const base = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return updatedAt ? `${base}?v=${encodeURIComponent(updatedAt)}` : base;
}

/**
 * Social-sharing (og:image) version of the thumbnail. Prefers YouTube's
 * full-resolution 1280×720 `maxresdefault.jpg`: the default `hqdefault.jpg`
 * is 480×360 with letterbox bars, which Facebook upscales into a blurry
 * card. Not every video has a maxres thumbnail — when it's missing YouTube
 * answers 404 with a ~1 KB 120×90 grey placeholder — so require a 200 *and*
 * a real-sized file, otherwise fall back to hqdefault. Runs only when the
 * page's metadata is generated (build / ISR revalidation), not per visitor.
 */
export async function youtubeShareImage(
  videoId: string,
  updatedAt?: string,
): Promise<{ url: string; width: number; height: number }> {
  const withVersion = (url: string) =>
    updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url;
  const maxres = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  try {
    // HEAD: only the status and size are needed. Generous timeout — a cold
    // connection can take a few seconds on some networks; on timeout we
    // still fall back safely.
    const res = await fetch(maxres, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
    });
    const bytes = Number(res.headers.get("content-length") ?? 0);
    if (res.ok && bytes > 5000) {
      return { url: withVersion(maxres), width: 1280, height: 720 };
    }
  } catch {
    // Network error or timeout — fall through to the always-present size.
  }
  return { url: youtubeThumbnailUrl(videoId, updatedAt), width: 480, height: 360 };
}
