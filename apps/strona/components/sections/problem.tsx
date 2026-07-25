import { Brush, Droplets, PawPrint, Wind } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * Edukacja rynku — sekcja w duchu Negacza: zanim padnie oferta i cena, klient
 * musi zrozumieć, DLACZEGO jego problem nie znika sam.
 *
 * Powód strategiczny: główną alternatywą klienta nie jest inny detailer, tylko
 * „nic nie robię" albo myjnia samoobsługowa za 30 zł (analiza rynku, wniosek 5).
 * Z ceną 300 zł nie wygrywa się przez porównanie cenników — wygrywa się przez
 * pokazanie, że to inna robota, nie droższa wersja odkurzania. Sekcja stoi
 * PRZED cennikiem, bo uzasadnia kwotę, zamiast się z niej tłumaczyć.
 *
 * Zapach i sierść dostają własne kafle celowo: to jedyne bóle, których myjnia
 * samoobsługowa strukturalnie nie rozwiąże — żeton i lanca ich nie ruszą.
 */
export function Problem() {
  const powody = [
    {
      icon: Droplets,
      title: "Plama siedzi pod spodem",
      text: "Tapicerka to materiał naciągnięty na gąbkę. Napój przechodzi przez splot i zostaje w środku. Odkurzacz zbiera to, co na wierzchu — resztę trzeba wypłukać i wyciągnąć na mokro.",
    },
    {
      icon: PawPrint,
      title: "Sierść wplata się w splot",
      text: "Włos psa wchodzi między nitki jak rzep. Samo ssanie go nie wyciągnie — potrzeba gumy, szczotki i przejścia metr po metrze.",
    },
    {
      icon: Wind,
      title: "Zapach to bakterie, nie powietrze",
      text: "Zapach bierze się z wilgoci i bakterii w gąbce siedzenia. Choinka i odświeżacz przykrywają go na tydzień. Para i ozonowanie likwidują źródło.",
    },
    {
      icon: Brush,
      title: "Myjnia robi blachę",
      text: "Żeton i lanca kończą się na karoserii. Do wnętrza nie wchodzą — a to wnętrze oglądasz codziennie i w nim wozisz ludzi.",
    },
  ];

  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="problem-heading"
            className="font-serif text-3xl leading-tight font-medium text-balance md:text-4xl"
          >
            Dlaczego odkurzacz i myjnia tego nie ruszą
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Nie dlatego, że źle odkurzasz. Dlatego, że brud, sierść i zapach
            siedzą tam, gdzie odkurzacz nie sięga.
          </p>
        </Reveal>

        <RevealStagger className="mt-10 grid gap-5 sm:grid-cols-2">
          {powody.map((powod) => (
            <RevealItem key={powod.title} className="h-full">
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-6">
                <powod.icon
                  className="mt-0.5 size-6 shrink-0 text-primary-strong"
                  aria-hidden
                />
                <div>
                  <h3 className="font-serif text-lg font-medium">
                    {powod.title}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-muted-foreground">
                    {powod.text}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Puenta uzasadniająca cenę — bez niej sekcja jest tylko ciekawostką. */}
        <Reveal className="mt-8">
          <p className="max-w-3xl text-pretty">
            Dlatego pranie tapicerki trwa kilka godzin i kosztuje 300 zł, a nie
            30. To nie jest dokładniejsze odkurzanie —{" "}
            <strong className="font-semibold">to inna robota</strong>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
