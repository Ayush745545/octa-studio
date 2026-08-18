"use client";

import { useState } from "react";
import { VideoOff } from "lucide-react";

interface VideoWithFallbackProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  poster?: string;
}

/**
 * Video element that degrades gracefully. When the source fails to load or
 * decode (404, wrong MIME type, unsupported codec) the browser's cryptic
 * "no video with supported format" message is replaced with a clear
 * "Preview unavailable" panel and a link to open the file directly.
 */
export default function VideoWithFallback({
  src,
  className,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  playsInline = false,
  poster,
}: VideoWithFallbackProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-500 ${className ?? ""}`}
      >
        <VideoOff className="size-8" />
        <span className="px-3 text-center text-xs">Preview unavailable</span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-black"
        >
          Open file
        </a>
      </div>
    );
  }

  return (
    <video
      src={src}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      poster={poster}
      onError={() => setErrored(true)}
    />
  );
}
