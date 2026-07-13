import type { KontaktData } from "@/lib/site";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „Jak wygląda współpraca" — obiekcja: „nie wiem jak to działa,
 * boję się stracić czas" (brief §4).
 */
export function Proces({ kontakt }: { kontakt: KontaktData }) {
  const steps = [
    {
      title: "Dzwonisz lub piszesz",
      text: "Mówisz co za auto i co mu dolega. Od razu podaję cenę i termin.",
    },
    {
      title: `Przyjeżdżasz do mnie do ${kontakt.city === "Łącko" ? "Czerńca" : kontakt.city}`,
      text: "Wszystko robię stacjonarnie, na miejscu — dojazd do klienta obecnie niedostępny.",
    },
    {
      title: "Odbierasz auto",
      text: "Płacisz gotówką lub BLIK-iem po obejrzeniu efektu.",
    },
  ];

  return (
    <section
      id="proces"
      aria-labelledby="proces-heading"
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="proces-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            Jak wygląda współpraca
          </h2>
        </Reveal>

        <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <RevealItem key={step.title} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <span
                  aria-hidden
                  className="font-serif text-4xl font-medium text-primary-strong/80"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-lg font-medium">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal className="mt-8">
          <p className="text-sm text-muted-foreground">
            Pracuję {kontakt.hoursNote}. Termin zwykle w 3–7 dni.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
