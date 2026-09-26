import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import {
  SchematBabel,
  SchematDuzaDziura,
  SchematDwaPrzebicia,
  SchematKapec,
  SchematLysyBieznik,
  SchematStaraGuma,
} from "./schematy-opon";
import { KartaStrefNaprawy } from "./strefy-naprawy";

/** Przypadki do wymiany — wspólne dla sekcji na stronie i plakatu do druku. */
export const PRZYPADKI_DO_WYMIANY = [
  {
    Schemat: SchematDuzaDziura,
    tytul: "Uszkodzenie większe niż limit",
    opis: "Każda strefa ma w tabeli maksymalny rozmiar dziury lub przecięcia. Większe uszkodzenie to za dużo przeciętego kordu — opona do wymiany.",
  },
  {
    Schemat: SchematDwaPrzebicia,
    tytul: "Dwa przebicia blisko siebie",
    opis: "Łaty nachodziłyby na siebie i osłabiały to samo miejsce. Taka opona nie wraca na koło.",
  },
  {
    Schemat: SchematBabel,
    tytul: "Bąbel na boku",
    opis: "Wybrzuszenie to zerwane nitki kordu po uderzeniu w krawężnik albo dziurę. Może pęknąć w trasie.",
  },
  {
    Schemat: SchematKapec,
    tytul: "Jazda bez powietrza",
    opis: "Nawet krótki odcinek na kapciu mieli oponę od środka. Z zewnątrz wygląda dobrze, w środku jest przetarta.",
  },
  {
    Schemat: SchematStaraGuma,
    tytul: "Spękana, stara guma",
    opis: "Opona starsza niż 8–10 lat (data w kodzie DOT) twardnieje i pęka — nawet z dobrym bieżnikiem.",
  },
  {
    Schemat: SchematLysyBieznik,
    tytul: "Bieżnik poniżej 1,6 mm",
    opis: "To prawne minimum w Polsce. Łatanie takiej opony nie ma sensu — i tak trzeba ją wymienić.",
  },
];

/**
 * „03 · uczciwie" — co nie kwalifikuje się do naprawy. Przy oponach
 * uczciwość to bezpieczeństwo: lepiej, żeby klient zobaczył to na schemacie
 * tutaj, niż usłyszał dopiero w warsztacie z kołem w ręku.
 */
export function Granice() {
  const przypadki = PRZYPADKI_DO_WYMIANY;

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
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] text-balance md:text-[40px]"
          >
            Co nie kwalifikuje się do naprawy
          </h2>
        </Reveal>

        <KartaStrefNaprawy />

        <RevealStagger className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {przypadki.map(({ Schemat, tytul, opis }) => (
            <RevealItem key={tytul} className="h-full">
              <div className="cien-akcent-6 flex h-full flex-col gap-3.5 rounded-2xl border-[3px] border-ink bg-background p-4">
                <div className="kropki rounded-xl border-2 border-ink bg-piasek px-2 py-3">
                  <Schemat />
                </div>
                <div className="flex flex-col gap-1.5 px-1.5 pb-1.5">
                  <h3 className="text-lg leading-[1.2] font-bold">{tytul}</h3>
                  <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                    {opis}
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
