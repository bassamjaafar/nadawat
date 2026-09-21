"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadPhotoAction } from "@/app/admin/(protected)/people/actions";

export function PhotoUpload({
  personId,
  initialUrl,
}: {
  personId: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uploads immediately on selection rather than waiting for a second,
  // separate "upload" click — that two-step flow was the actual cause of
  // reports that "the upload button does nothing": most clicks were landing
  // back on the native "Choose File" control instead of the real button.
  // Reading the file straight off the change event (not a ref, read again
  // later on click) also rules out the file list going stale between steps.
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setPending(true);
    const formData = new FormData();
    formData.set("photo", file);
    const result = await uploadPhotoAction(personId, formData);
    setPending(false);
    e.target.value = "";

    if ("error" in result) {
      setError(result.error);
      setPreview(null);
      return;
    }
    setUrl(result.url);
    setPreview(null);
  }

  const displayUrl = preview ?? url;

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row">
      <div className="relative size-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-cream-deep">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
            unoptimized={!!preview}
          />
        ) : null}
      </div>
      <div className="flex min-w-0 max-w-full flex-col gap-3">
        {error ? <p className="text-[0.85rem] text-[#8f3520]">{error}</p> : null}
        <label className="text-[0.85rem]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            disabled={pending}
            className="text-[0.85rem] disabled:opacity-60"
          />
        </label>
        {pending ? (
          <p className="text-[0.8rem] text-olive">جارٍ الرفع…</p>
        ) : (
          <p className="text-[0.8rem] text-muted">JPG أو PNG أو WEBP، حتى 5 ميغابايت.</p>
        )}
      </div>
    </div>
  );
}
