// Vercel rejects request bodies over ~4.5 MB before they reach the site, so a
// large camera or phone photo can never be uploaded as-is. Photos are shown
// small (at most a few hundred pixels wide), so we scale them down in the
// browser first. Small files go up untouched, keeping their exact quality.

const MAX_SIDE = 1600;
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;
const QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("decode failed"));
    };
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Returns a file small enough to upload. If the browser can't decode or
 * re-encode the image, the original is returned and the server's own checks
 * decide.
 */
export async function shrinkImage(file: File): Promise<File> {
  try {
    const img = await loadImage(file);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (file.size <= KEEP_AS_IS_BYTES && longest <= MAX_SIDE) return file;

    const scale = Math.min(1, MAX_SIDE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // WebP keeps transparency. Browsers that can't encode WebP hand back a
    // PNG instead, so fall back to JPEG on a white background.
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let blob = await toBlob(canvas, "image/webp");
    if (!blob || blob.type !== "image/webp") {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blob = await toBlob(canvas, "image/jpeg");
    }
    if (!blob || blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], name, { type: blob.type });
  } catch {
    return file;
  }
}
