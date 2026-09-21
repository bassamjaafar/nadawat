"use client";

import Image from "next/image";
import { useState } from "react";
import { youtubeThumbnailUrl } from "@/lib/youtube";

/**
 * Privacy-conscious YouTube embed: shows the thumbnail until the visitor
 * chooses to play, then loads the player from youtube-nocookie.com. Never
 * autoplays on page load.
 */
export function YouTubeEmbed({
  videoId,
  title,
  updatedAt,
}: {
  videoId: string;
  title: string;
  updatedAt?: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-olive">
      {active ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&hl=ar`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 size-full"
          aria-label={`تشغيل الفيديو: ${title}`}
        >
          <Image
            src={youtubeThumbnailUrl(videoId, updatedAt)}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-olive/25 transition-colors group-hover:bg-olive/15" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-cream/95 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="ms-1 size-6 fill-olive" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
