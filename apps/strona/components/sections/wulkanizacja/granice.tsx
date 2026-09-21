import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „03 · uczciwie" — odpowiednik sekcji „Co wyjdzie, a co zostanie" ze strony
 * detailingu: te same karty z dwiema połówkami (naprawię / nie naprawię),
 * ten sam dymek z obietnicą na dole. Przy oponach uczciwość to bezpieczeństwo:
 * naprawa boku opony jest niebezpieczna i nie robię jej, nawet jeśli klient
 * prosi — lepiej, żeby przeczytał to tutaj, niż usłyszał dopiero w warsztacie.
 */
export function Granice() {
  const granice = [
    {
      title: "Przebicie w bieżniku",
      subtitle: "Gwóźdź, wkręt, drut",
      naprawie: "Łata od środka z kołkiem — naprawa trwała, opona wraca na koło.",
      nie: "Dziura powyżej 6 mm albo dwie blisko siebie — opona do wymiany.",
    },
    {
      title: "Uszkodzony bok opony",
      subtitle: "Przecięcie, bąbel, starcie o krawężnik",
      naprawie: "Ocenię, czy da się bezpiecznie dojechać do sklepu po nową.",
      nie: "Boku nie naprawiam — łata w tym miejscu puszcza przy prędkości. Bez wyjątków.",
    },
    {
      title: "Stara opona",
      subtitle: "DOT powyżej 8–10 lat",
      naprawie: "Zmontuję, jeśli guma nie ma pęknięć i bieżnik jest powyżej 3 mm.",
      nie: "Spękana, stwardniała opona nie wraca na koło, nawet z dobrym bieżnikiem — powiem wprost.",
    },
    {
      title: "Felga",
      subtitle: "Krzywa, pęknięta, przetarta",
      naprawie: "Przy wyważaniu sprawdzę bicie i pokażę na maszynie, co jest nie tak.",
      nie: "Nie prostuję i nie spawam felg — polecę warsztat, który robi to dobrze.",
    },
  ];

  return (
    <section
      id="granice"
      aria-labelledby="granice-heading"
      className="scroll-mt-24"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-col gap-2.5">
          <p className="etykieta w-max -rotate-1 rounded-full border-2 border-ink bg-akcent px-3.5 py-1.5">
            03 · uczciwie
          </p>
          <h2
            id="granice-heading"
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
          >
            Co naprawię, a czego nie
          </h2>
        </Reveal>

        <RevealStagger className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
          {granice.map((granica) => (
            <RevealItem key={granica.title} className="h-full">
              <div className="cien-akcent-6 flex h-full flex-col gap-3 rounded-2xl border-[3px] border-ink p-[22px]">
                <div>
                  <h3 className="text-lg font-bold">{granica.title}</h3>
                  <p className="etykieta-sm mt-1 text-muted-foreground">
                    {granica.subtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                    {granica.naprawie}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 border-t-2 border-dashed border-kreska pt-3">
                  <p className="etykieta-sm text-muted-foreground">nie</p>
                  <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                    {granica.nie}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal className="border-l-4 border-akcent pl-3.5">
          <p className="text-lg leading-[1.4] font-bold text-pretty">
            Jeśli po zdjęciu koła zobaczę, że opona nie nadaje się do naprawy
            — powiem od razu i nie policzę za oglądanie.
          </p>
          <p className="mt-2 text-sm text-pretty text-muted-foreground">
            Przy każdej wizycie sprawdzam gratis ciśnienie, bieżnik i wiek
            wszystkich opon, także zapasowej.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
