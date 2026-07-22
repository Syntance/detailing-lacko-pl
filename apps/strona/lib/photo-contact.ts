/**
 * Konwersja główna strony: wiadomość ze zdjęciem plamy/wnętrza (UVP v3 —
 * „wycena ze zdjęcia usuwa barierę telefonu"). Docelowo WhatsApp/Messenger
 * (messengerUrl z panelu Magazyn → Dane firmy); dopóki nie jest ustawiony,
 * fallback to SMS z prewypełnioną wiadomością — działa na każdym telefonie
 * bez zakładania, że numer ma WhatsAppa.
 */

export const PHOTO_MESSAGE = "Dzień dobry, wysyłam zdjęcie — proszę o cenę i termin.";

export function buildPhotoContactHref(kontakt: {
  messengerUrl: string;
  phoneE164: string;
}): string {
  if (kontakt.messengerUrl) return kontakt.messengerUrl;
  // „?&body=" — jedyny zapis akceptowany jednocześnie przez iOS i Androida.
  return `sms:${kontakt.phoneE164}?&body=${encodeURIComponent(PHOTO_MESSAGE)}`;
}
