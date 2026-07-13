import Image from "next/image";
import type { HeroContent } from "@moduly/types";
import { MessageCircle, Phone, Star } from "lucide-react";
import type { KontaktData } from "@/lib/site";
import { MessengerLink, PhoneLink } from "./phone-link";

/**
 * Hero — pytanie klienta: „czy to dla mnie i ile kosztuje?" (brief §1).
 * Treść edytowalna w Magazyn → CMS → Strona główna. LCP: zdjęcie z priority,
 * wejście czysto CSS-owe (bez JS przed pierwszym renderem).
 */
export function Hero({
  hero,
  kontakt,
}: {
  hero: HeroContent | undefined;
  kontakt: KontaktData;
}) {
  const headline =
    hero?.headline ?? "Detailing Łącko — pranie tapicerki i polerowanie lakieru";
  const description =
    hero?.description ??
    `Fotele jak nowe od 250 zł. Lakier bez rys od 600 zł. Przyjmuję na miejscu w ${kontakt.city} — zapraszam z okolicy: Stary Sącz, Podegrodzie, Nowy Sącz.`;
  const imageUrl = hero?.desktopImageUrl ?? "/images/hero.jpg";

  return (
    <section
      id="hero"
      aria-label="Detailing Łącko"
      className="relative flex min-h-[92svh] items-end overflow-hidden"
    >
      <Image
        src={imageUrl}
        alt="Pranie tapicerki — fotel przed i po czyszczeniu"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background via-background/82 to-background/20"
      />

      <div className="relative mx-auto w-full max-w-5xl px-6 pt-36 pb-16 md:pb-24">
        <p className="hero-enter text-xs font-semibold tracking-[0.3em] text-primary-strong uppercase">
          Łącko · Nowy Sącz i okolice
        </p>
        <h1 className="hero-enter mt-4 max-w-3xl font-serif text-4xl leading-[1.08] font-medium text-balance md:text-6xl [animation-delay:90ms]">
          {headline}
        </h1>
        <p className="hero-enter mt-5 max-w-2xl text-lg text-pretty text-muted-foreground md:text-xl [animation-delay:180ms]">
          {description}
        </p>

        <div className="hero-enter mt-8 flex flex-col gap-3 sm:flex-row sm:items-center [animation-delay:270ms]">
          <PhoneLink
            phoneE164={kontakt.phoneE164}
            section="hero"
            className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none"
            ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
          >
            <Phone className="size-5" aria-hidden />
            Zadzwoń: {kontakt.phoneDisplay}
          </PhoneLink>

          {kontakt.messengerUrl ? (
            <MessengerLink
              url={kontakt.messengerUrl}
              section="hero"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-background/40 px-7 py-3.5 text-base font-medium text-foreground backdrop-blur transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <MessageCircle className="size-5" aria-hidden />
              Napisz na Messengerze
            </MessengerLink>
          ) : (
            <a
              href="#kontakt"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-background/40 px-7 py-3.5 text-base font-medium text-foreground backdrop-blur transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <MessageCircle className="size-5" aria-hidden />
              Napisz wiadomość
            </a>
          )}
        </div>

        <p className="hero-enter mt-6 flex items-center gap-2 text-sm text-muted-foreground [animation-delay:360ms]">
          <Star className="size-4 fill-primary-strong text-primary-strong" aria-hidden />
          Opinie 5/5 na Google · zdjęcia przed/po każdej realizacji
        </p>
      </div>
    </section>
  );
}
