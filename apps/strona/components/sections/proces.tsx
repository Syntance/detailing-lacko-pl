import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „Co wyjdzie, a co zostanie" — uczciwie o granicach usług, zamiast dawnej
 * procedury rezerwacji „Trzy kroki i po sprawie". Każda karta rozbija dawne
 * jedno zdanie na dwie połówki (efekt / granica) — ta sama treść, czytelniej
 * rozdzielona. Pod kartami dymek z żółtą kreską: obietnica, że nie wezmę
 * nie wezmę zlecenia, którego efekt nie będzie wart ceny.
 */
export function Proces() {
  const limity = [
    {
      title: "One step",
      subtitle: "Jednoetapowa polerka",
      wyjdzie: "Znika 50–70% rys.",
      zostaje:
        "Te wyczuwalne paznokciem zostają — na nie trzeba szlifu, a szlifu nie robię.",
    },
    {
      title: "Pranie tapicerki",
      subtitle: "",
      wyjdzie: "Kawa, błoto, sierść i zapach schodzą.",
      zostaje: "Przypalenia, rozdarcia i stary olej zostają.",
    },
    {
      title: "Dekontaminacja",
      subtitle: "",
      wyjdzie: "Opiłki z hamulców i smoła schodzą w całości.",
      zostaje: "Rysy, które były pod nimi, zostają — to robota dla polerki.",
    },
    {
      title: "Ozonowanie",
      subtitle: "",
      wyjdzie: "Likwiduje zapach, nie maskuje go.",
      zostaje: "Wraca, jeśli źródło zostaje w aucie.",
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
            Co wyjdzie, a co zostanie
          </h2>
        </Reveal>

        <RevealStagger className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
          {limity.map((limit) => (
            <RevealItem key={limit.title} className="h-full">
              <div className="cien-zolty-6 flex h-full flex-col gap-3 rounded-2xl border-[3px] border-ink p-[22px]">
                <div>
                  <h3 className="text-lg font-bold">{limit.title}</h3>
                  {limit.subtitle ? (
                    <p className="etykieta-sm mt-1 text-muted-foreground">
                      {limit.subtitle}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                    {limit.wyjdzie}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 border-t-2 border-dashed border-kreska pt-3">
                  <p className="etykieta-sm text-muted-foreground">zostaje</p>
                  <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                    {limit.zostaje}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal className="border-l-4 border-zolty pl-3.5">
          <p className="text-lg leading-[1.4] font-bold text-pretty">
            Jeśli po zdjęciu zobaczę, że efekt nie będzie wart ceny — odradzę
            i nie wezmę zlecenia.
          </p>
          <p className="mt-2 text-sm text-pretty text-muted-foreground">
            Zdjęcie dorzucasz opcjonalnie przy rezerwacji — przy plamach
            i rysach przyspiesza potwierdzenie.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
