import { Brush, Gauge, Scale, ShieldCheck } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „02 · jak pracuję" — główne wyróżniki warsztatu zamiast przebiegu wizyty.
 * Czas wizyty jest już w hero i w cenniku; tu klient ma zobaczyć, czym ta
 * wulkanizacja różni się od „szybkiej przekładki" w sezonie.
 */
export function Zasady() {
  const zasady = [
    {
      Ikona: Gauge,
      tytul: "Dokręcam kluczem dynamometrycznym",
      plakietka: "Nm dla modelu",
      opis:
        "Każde auto ma swój moment dokręcania kół — sprawdzam go dla Twojego modelu i dokręcam ręcznie, na krzyż. Żadnego dobijania śrub pneumatem do oporu.",
    },
    {
      Ikona: ShieldCheck,
      tytul: "Łatam tylko grzybkiem i profesjonalną łatą",
      plakietka: "od środka",
      opis:
        "Przebitą oponę zdejmuję z felgi i naprawiam od środka. Żadnych sznurków wciskanych z zewnątrz.",
    },
    {
      Ikona: Brush,
      tytul: "Czyszczę piastę przed założeniem koła",
      plakietka: "styk bez rdzy",
      opis:
        "Rdza między piastą a felgą to bicie na kierownicy i śruby, które same się luzują. Minuta z drucianą szczotką i koło siada równo.",
    },
    {
      Ikona: Scale,
      tytul: "Wyważam każde koło od zera",
      plakietka: "nowe ciężarki",
      opis:
        "Stare ciężarki zdejmuję, koło centruję na maszynie i po korekcie puszczam je jeszcze raz na kontrolę. Kierownica ma nie drgać przy 120 km/h.",
    },
  ];

  return (
    <section
      id="zasady"
      aria-labelledby="zasady-heading"
      className="scroll-mt-24 border-y-[3px] border-ink bg-piasek"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="etykieta w-max rotate-[1.5deg] rounded-full border-2 border-ink bg-akcent px-3.5 py-1.5">
              02 · jak pracuję
            </p>
            <h2
              id="zasady-heading"
              className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
            >
              Na tym nie oszczędzam
            </h2>
          </div>
        </Reveal>

        <RevealStagger className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
          {zasady.map(({ Ikona, tytul, plakietka, opis }) => (
            <RevealItem key={tytul} className="h-full">
              <div className="cien-akcent-6 flex h-full flex-col gap-3.5 rounded-2xl border-[3px] border-ink bg-background p-[22px]">
                <div className="flex items-center justify-between gap-3">
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-akcent"
                  >
                    <Ikona className="size-5" strokeWidth={2.5} />
                  </span>
                  <span className="etykieta-sm rounded-full whitespace-nowrap border-2 border-ink bg-background px-2.5 py-1">
                    {plakietka}
                  </span>
                </div>
                <h3 className="text-lg leading-[1.2] font-bold text-balance">
                  {tytul}
                </h3>
                <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                  {opis}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
