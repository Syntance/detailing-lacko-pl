"use client";

import type { ReactNode } from "react";
import { trackMessengerClick, trackPhoneClick, trackPhotoClick } from "@/lib/track";

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

/**
 * CTA konwersji głównej — „Wyślij zdjęcie". href z buildPhotoContactHref()
 * (Messenger/WhatsApp z panelu albo fallback SMS z prewypełnioną wiadomością).
 */
export function PhotoLink({
  href,
  section,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  section: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      onClick={() => trackPhotoClick(section)}
      className={className}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
