"use client";

import type { ReactNode } from "react";
import { trackMessengerClick, trackPhoneClick } from "@/lib/track";

/** Klikalny telefon — jedna konwersja główna strony. */
export function PhoneLink({
  phoneE164,
  section,
  className,
  children,
  ariaLabel,
}: {
  phoneE164: string;
  section: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={`tel:${phoneE164}`}
      onClick={() => trackPhoneClick(section)}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

export function MessengerLink({
  url,
  section,
  className,
  children,
}: {
  url: string;
  section: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackMessengerClick(section)}
      className={className}
    >
      {children}
    </a>
  );
}
