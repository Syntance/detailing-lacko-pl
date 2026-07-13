"use client";

import { track } from "@moduly/analytics";

/**
 * Taksonomia zdarzeń z briefu, zmapowana na rejestr @syntance/analytics-events
 * (track() ignoruje eventy spoza rejestru, więc nazwy własne przechodzą
 * przez cta_id/channel):
 *
 * contact_phone_click      → contact_click { channel: "phone", location }
 * contact_messenger_click  → contact_click { channel: "messenger", location }
 * pricing_expand           → cta_click { cta_id: "pricing_expand" }
 * gallery_compare_interact → cta_click { cta_id: "gallery_compare_interact" }
 * faq_open                 → cta_click { cta_id: "faq_open", cta_label: pytanie }
 * review_link_click        → outbound_click { url, link_text }
 */
export function trackPhoneClick(section: string): void {
  track("contact_click", { channel: "phone", location: section });
}

export function trackMessengerClick(section: string): void {
  track("contact_click", { channel: "messenger", location: section });
}

export function trackPricingExpand(expanded: boolean): void {
  track("cta_click", {
    cta_id: "pricing_expand",
    cta_label: expanded ? "rozwiń" : "zwiń",
    location: "cennik",
  });
}

export function trackCompareInteract(pairId: string): void {
  track("cta_click", {
    cta_id: "gallery_compare_interact",
    cta_label: pairId,
    location: "przed-po",
  });
}

export function trackFaqOpen(question: string): void {
  track("cta_click", { cta_id: "faq_open", cta_label: question, location: "faq" });
}

export function trackReviewClick(url: string): void {
  track("outbound_click", { url, link_text: "Zostaw opinię" });
}
