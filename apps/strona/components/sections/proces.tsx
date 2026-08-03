import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * Zastępuje dawną „Trzy kroki i po sprawie" (proces współpracy) — zamiast
 * procedury rezerwacji, uczciwie mówimy, czego dana usługa NIE naprawi.
 * Cztery karty zamiast trzech (jedna usługa więcej niż w starej makiecie),
 * więc grid rośnie do 2×2 / 4 kolumn zamiast 1×3.
 */
export function Proces() {
  const limity = [
    {
      title: "One step",
      text: "znika 50–70% rys. Te wyczuwalne paznokciem zostają.",
    },
    {
      title: "Pranie tapicerki",
      text: "kawa, błoto, sierść i zapach schodzą. Przypalenia, rozdarcia i stary olej zostają.",
    },
    {
      title: "Dekontaminacja",
      text: "opiłki z hamulców i smoła schodzą w całości. Rysy, które były pod nimi, zostają — to robota dla polerki.",
    },
    {
      title: "Ozonowanie",
      text: "likwiduje zapach, nie maskuje go. Wraca, jeśli źródło zostaje w aucie.",
    },
  ];

  return (
    <section id="jak" aria-labelledby="jak-heading" className="scroll-mt-24">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-col gap-2.5">
          <p className="etykieta w-max -rotate-1 rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5">
            03 · uczciwie
          </p>
          <h2
            id="jak-heading"
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
          >
            Czego nie naprawię
          </h2>
        </Reveal>

        <RevealStagger className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
          {limity.map((limit) => (
            <RevealItem key={limit.title} className="h-full">
              <div className="cien-zolty-6 flex h-full flex-col gap-3 rounded-2xl border-[3px] border-ink p-[22px]">
                <h3 className="text-lg font-bold">{limit.title}</h3>
                <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                  {limit.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
