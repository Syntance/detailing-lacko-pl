import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „02 · jak to wygląda" — odpowiednik sekcji Efekty ze strony detailingu.
 * Przy oponach nie ma zdjęć przed/po; barierą klienta jest czas i „czy muszę
 * czekać w kolejce" — więc sekcja rozkłada wizytę na cztery kroki z realnym
 * czasem każdego. Jak w reszcie makiety: plakietka, kafelki z twardą kreską
 * i cieniem w akcencie, numer kroku w kółku (jak `Krok` w widgecie
 * rezerwacji detailingu), na końcu naklejki z łącznym czasem.
 */
export function Przebieg() {
  const kroki = [
    {
      tytul: "Przyjeżdżasz na swoją godzinę",
      czas: "0 min",
      opis:
        "Godzinę umawiasz telefonicznie i jest tylko Twoja — nie stoisz w sezonowej kolejce i nie czekasz, aż „zejdzie” poprzednie auto.",
    },
    {
      tytul: "Zdejmuję koła i oglądam opony",
      czas: "5 min",
      opis:
        "Bieżnik, wiek (DOT), pęknięcia, zaworki, luz w kole. Jeśli coś jest nie tak, mówię od razu — nie po fakcie i nie przy kasie.",
    },
    {
      tytul: "Wymiana i wyważanie",
      czas: "30 min",
      opis:
        "Każde koło na maszynie, nowe ciężarki, zaworki na życzenie. Opony na felgach czy przekładka — czas i cena z cennika, bez niespodzianek.",
    },
    {
      tytul: "Dokręcanie i ciśnienie",
      czas: "10 min",
      opis:
        "Klucz dynamometryczny wg momentu producenta, ciśnienie ustawione pod Twoje auto i obciążenie. Po ok. 50 km warto dokręcić raz jeszcze — przypomnę SMS-em.",
    },
  ];

  return (
    <section
      id="przebieg"
      aria-labelledby="przebieg-heading"
      className="scroll-mt-24 border-y-[3px] border-ink bg-piasek"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="etykieta w-max rotate-[1.5deg] rounded-full border-2 border-ink bg-akcent px-3.5 py-1.5">
              02 · jak to wygląda
            </p>
            <h2
              id="przebieg-heading"
              className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
            >
              45 minut i jedziesz
            </h2>
          </div>
          <p className="max-w-[34ch] border-l-4 border-akcent pl-3.5 text-[15px] leading-[1.5] font-medium text-pretty">
            Auto robię od razu po przyjeździe — możesz poczekać na miejscu
            albo skoczyć do sklepu obok
          </p>
        </Reveal>

        <RevealStagger className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
          {kroki.map((krok, index) => (
            <RevealItem key={krok.tytul} className="h-full">
              <div className="cien-akcent-6 flex h-full flex-col gap-3.5 rounded-2xl border-[3px] border-ink bg-background p-[22px]">
                <div className="flex items-center justify-between gap-3">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-akcent text-[15px] font-bold"
                  >
                    {index + 1}
                  </span>
                  <span className="etykieta-sm rounded-full border-2 border-ink bg-background px-2.5 py-1">
                    {krok.czas}
                  </span>
                </div>
                <h3 className="text-lg leading-[1.2] font-bold">
                  <span className="sr-only">Krok {index + 1}: </span>
                  {krok.tytul}
                </h3>
                <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                  {krok.opis}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal className="flex flex-wrap items-center gap-3.5">
          <p className="etykieta cien-3 w-max -rotate-1 rounded-full border-2 border-ink bg-background px-4 py-2">
            przekładka kół: ok. 45 min
          </p>
          <p className="etykieta cien-3 w-max rotate-[1.2deg] rounded-full border-2 border-ink bg-background px-4 py-2">
            opony na felgach: ok. 1 h
          </p>
          <p className="etykieta cien-3 w-max -rotate-[0.6deg] rounded-full border-2 border-ink bg-akcent px-4 py-2">
            naprawa przebicia: 30 min
          </p>
        </Reveal>
      </div>
    </section>
  );
}
