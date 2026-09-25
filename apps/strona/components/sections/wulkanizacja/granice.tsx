import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import {
  SchematBabel,
  SchematDuzaDziura,
  SchematDwaPrzebicia,
  SchematKapec,
  SchematLysyBieznik,
  SchematStaraGuma,
  SchematStrefNaprawy,
  KOLOR_STREFY,
} from "./schematy-opon";

/**
 * „03 · uczciwie" — co nie kwalifikuje się do naprawy. Przy oponach
 * uczciwość to bezpieczeństwo: lepiej, żeby klient zobaczył to na schemacie
 * tutaj, niż usłyszał dopiero w warsztacie z kołem w ręku.
 */
export function Granice() {
  const przypadki = [
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

  const strefy = [
    { nazwa: "Środek bieżnika", opis: "grzybek albo łata, do 6–10 mm", kolor: KOLOR_STREFY.bieznik },
    { nazwa: "Bark", opis: "łata radialna, do 3–6 mm", kolor: KOLOR_STREFY.bark },
    { nazwa: "Bok", opis: "łata radialna, do 6–10 mm", kolor: KOLOR_STREFY.bok },
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
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] text-balance md:text-[40px]"
          >
            Co nie kwalifikuje się do naprawy
          </h2>
        </Reveal>

        <Reveal className="cien-akcent-6 grid items-center gap-6 rounded-2xl border-[3px] border-ink bg-background p-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="kropki rounded-xl border-2 border-ink bg-piasek px-3 py-5 sm:px-6">
            <SchematStrefNaprawy />
          </div>
          <div className="flex flex-col gap-4 lg:pr-2">
            <h3 className="text-2xl leading-[1.15] font-bold text-balance">
              Naprawiam według tabeli producenta łatek
            </h3>
            <p className="text-[15px] leading-[1.55] text-pretty text-tekst">
              Da się naprawić nie tylko środek bieżnika — bark i bok też, łatą
              radialną z&nbsp;wulkanizacją. Ale tylko do rozmiaru, na który
              pozwala tabela dla indeksu prędkości Twojej opony. Powyżej
              limitu opona idzie do wymiany.
            </p>
            <ul className="flex flex-col gap-2.5">
              {strefy.map((strefa, index) => (
                <li key={strefa.nazwa} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full border-[3px] border-ink text-sm font-bold"
                    style={{ background: strefa.kolor }}
                  >
                    {index + 1}
                  </span>
                  <p className="text-[15px] leading-[1.4]">
                    <span className="font-bold">{strefa.nazwa}</span>
                    <span className="text-tekst"> — {strefa.opis}</span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="etykieta-sm text-muted-foreground">
              limity dla indeksu H · przy Q i T tabela pozwala na więcej
            </p>
          </div>
        </Reveal>

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
