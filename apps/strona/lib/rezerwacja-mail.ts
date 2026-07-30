import "server-only";

import type { RezerwacjaUsluga } from "./rezerwacje";
import { formatDuration } from "./cennik";

/**
 * Powiadomienie e-mail do właściciela o nowej rezerwacji (Resend REST, bez
 * dodatkowej zależności). Bez tego jedynym sygnałem byłoby zajrzenie do panelu.
 *
 * Fail-soft: błąd wysyłki nigdy nie przewraca rezerwacji — jest już w bazie.
 * Adres docelowy: `CONTACT_INBOX_EMAIL` (ten sam co formularz kontaktowy).
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendRezerwacjaNotification(input: {
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  services: RezerwacjaUsluga[];
  durationMinutes: number;
  pickupDate: string;
  pickupTime: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const to = process.env.CONTACT_INBOX_EMAIL?.trim();
  if (!apiKey || !from || !to) return;

  const uslugi = input.services
    .map((s) => `${s.name} (${s.priceLabel})`)
    .join(", ");
  const odbior =
    input.pickupDate === input.date
      ? `tego samego dnia ok. ${input.pickupTime}`
      : `${input.pickupDate} ok. ${input.pickupTime} — auto zostaje na noc`;

  const wiersze: [string, string][] = [
    ["Termin", `${input.date}, godz. ${input.time}`],
    ["Klient", `${input.name} · ${input.phone}${input.email ? ` · ${input.email}` : ""}`],
    ["Usługi", uslugi],
    ["Czas pracy", `ok. ${formatDuration(input.durationMinutes)}`],
    ["Odbiór", odbior],
  ];
  if (input.note) wiersze.push(["Uwagi", input.note]);

  const html = [
    `<h2 style="font-family:sans-serif">Nowa rezerwacja online</h2>`,
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">`,
    ...wiersze.map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7075">${escapeHtml(k)}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
    ),
    `</table>`,
    `<p style="font-family:sans-serif;font-size:13px;color:#6b7075">Rezerwacja wstępna — potwierdź ją w panelu Magazyn → Rezerwacje.</p>`,
  ].join("");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nowa rezerwacja: ${input.date} ${input.time} — ${input.name}`,
        html,
        // Odpowiedź z panelu poczty leci prosto do klienta, gdy podał e-mail.
        ...(input.email ? { reply_to: input.email } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[rezerwacje] Resend:", res.status, await res.text());
    }
  } catch (error) {
    console.error("[rezerwacje] Wysyłka powiadomienia nie powiodła się:", error);
  }
}
