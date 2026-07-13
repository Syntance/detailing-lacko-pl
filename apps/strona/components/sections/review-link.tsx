"use client";

import { trackReviewClick } from "@/lib/track";

export function ReviewLink({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackReviewClick(url)}
      className={className}
    >
      Zostaw opinię na Google ★
    </a>
  );
}
