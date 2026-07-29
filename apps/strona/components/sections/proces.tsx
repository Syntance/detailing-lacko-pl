import type { KontaktData } from "@/lib/site";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „Trzy kroki i po sprawie" 1:1 z makietą „kreskówka": trzy karty z żółtym
 * cieniem i numerem w żółtym kółku. Copy z makiety (krok 2 bierze adres
 * z panelu Magazyn → Dane firmy, żeby nie dublować go w kodzie).
 */
export function Proces({ kontakt }: { kontakt: KontaktData }) {
  const steps = [
    {
      title: "Wysyłasz zdjęcie albo dzwonisz",
      text: "Dostajesz cenę z cennika i termin. Jeśli plama nie zejdzie — mówimy teraz, nie przy odbiorze.",
    },
    {
      title: `Przywozisz auto do ${kontakt.addressLine}`,
      text: "Po pracy (po 16:00) albo w weekend. Termin zwykle w 3–7 dni.",
    },
    {
      title: "Płacisz po obejrzeniu efektu",
      text: "Gotówka lub BLIK. Zero przedpłat — ryzyko „nie wyszło” jest po naszej stronie.",
    },
  ];

  return (
    <section id="jak" aria-labelledby="jak-heading" className="scroll-mt-24">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-col gap-2.5">
          <p className="w-max -rotate-1 rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase">
            03 · współpraca
          </p>
          <h2
            id="jak-heading"
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
          >
            Trzy kroki i po sprawie
          </h2>
        </Reveal>

        <RevealStagger className="grid gap-[22px] md:grid-cols-3">
          {steps.map((step, index) => (
            <RevealItem key={step.title} className="h-full">
              <div className="cien-zolty-6 flex h-full flex-col gap-3 rounded-2xl border-[3px] border-ink p-[22px]">
                <span
                  aria-hidden
                  className="grid size-[52px] place-items-center rounded-full border-[3px] border-ink bg-zolty text-xl font-bold"
                >
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                  {step.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
