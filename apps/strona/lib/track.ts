"use client";

import { track } from "@moduly/analytics";

/**
 * Taksonomia zdarzeń z briefu, zmapowana na rejestr @syntance/analytics-events
 * (track() ignoruje eventy spoza rejestru, więc nazwy własne przechodzą
 * przez cta_id/channel):
 *
 * contact_phone_click      → contact_click { channel: "phone", location }
 * contact_messenger_click  → contact_click { channel: "messenger", location }
 * booking_start            → cta_click { cta_id: "booking_start", location }
 * gallery_compare_interact → cta_click { cta_id: "gallery_compare_interact" }
 * review_link_click        → outbound_click { url, link_text }
 * lead_submit              → wysłana rezerwacja (source: "rezerwacja")
 *
 * Lejek konwersji: booking_start (klik CTA) → lead_submit (rezerwacja).
 * pricing_expand / faq_open zniknęły razem z akordeonami — makieta
 * „kreskówka" pokazuje cennik i FAQ od razu, więc nie ma czego mierzyć.
 */
export function trackPhoneClick(section: string): void {
  track("contact_click", { channel: "phone", location: section });
}

/** Konwersja główna: klik „Zarezerwuj termin" — skok do sekcji rezerwacji. */
export function trackBookingCta(section: string): void {
  track("cta_click", {
    cta_id: "booking_start",
    cta_label: "Zarezerwuj termin",
    location: section,
  });
}

/** Ścieżka poboczna: klik „Wyślij zdjęcie" (WhatsApp/Messenger/SMS). */
export function trackPhotoClick(section: string): void {
  track("contact_click", { channel: "photo", location: section });
}

export function trackMessengerClick(section: string): void {
  track("contact_click", { channel: "messenger", location: section });
}

export function trackCompareInteract(pairId: string): void {
  track("cta_click", {
    cta_id: "gallery_compare_interact",
    cta_label: pairId,
    location: "przed-po",
  });
}

export function trackReviewClick(url: string): void {
  track("outbound_click", { url, link_text: "Zostaw opinię" });
}

export function trackReservationSubmit(email: string): void {
  const domain = email.includes("@") ? email.split("@")[1] : undefined;
  track("lead_submit", { source: "rezerwacja", email_domain: domain });
}
