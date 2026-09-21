"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function onUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("يرجى اختيار صورة أولًا.");
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("photo", file);
    const result = await uploadPhotoAction(personId, formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setUrl(result.url);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = preview ?? url;

  return (
    <div className="flex items-start gap-5">
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
      <div className="flex flex-col gap-3">
        {error ? <p className="text-[0.85rem] text-[#8f3520]">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="text-[0.85rem]"
        />
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onUpload}
          >
            {pending ? "جارٍ الرفع…" : "رفع الصورة"}
          </Button>
        </div>
        <p className="text-[0.8rem] text-muted">JPG أو PNG أو WEBP، حتى 5 ميغابايت.</p>
      </div>
    </div>
  );
}
