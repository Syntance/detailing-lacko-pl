import {
  Banknote,
  Camera,
  Droplets,
  ListChecks,
  MapPin,
  MessageSquare,
  MinusCircle,
} from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „To nie myjnia — i nie „wycena indywidualna"" — lęk zaufania: „czym się
 * różnisz od myjni i od reszty?" (plan www v2 §5). Pięć obietnic z dowodami
 * + uczciwość o granicach jako wyróżnik, nie słabość.
 */
export function DlaczegoJa() {
  // Kolejność wg tego, jak trudno to skopiować konkurencji. Cennik na stronie
  // KZ Garage może opublikować w tydzień — realne przyjęcie ryzyka („nie
  // wyszło, nie płacisz") i uczciwa dyskwalifikacja zlecenia przed przyjazdem
  // wymagają zmiany modelu, nie tekstu. Dlatego one idą pierwsze.
  const points = [
    {
      icon: Banknote,
      title: "Nie wyszło — nie płacisz",
      text: "Najpierw oglądasz efekt, potem płacisz. Gotówka lub BLIK, zero przedpłat. Ryzyko jest po naszej stronie.",
    },
    {
      icon: MessageSquare,
      title: "Ocena, zanim przyjedziesz",
      text: "Ze zdjęcia mówimy, czy plama zejdzie. Jeśli oceniamy, że nie — mówimy to od razu, zamiast brać auto i tłumaczyć się przy odbiorze.",
    },
    {
      icon: ListChecks,
      title: "Cennik na stronie",
      text: "Cała lista z cenami. Bez „od”, bez widełek, bez „wyceny indywidualnej”.",
    },
    {
      icon: Camera,
      title: "Zdjęcia przed/po",
      text: "Z każdej roboty. Widzisz, za co płacisz — zanim się zdecydujesz.",
    },
    {
      icon: Droplets,
      title: "Ręcznie, parą i chemią",
      text: "Piana, dwa wiadra, mikrofibra, parownica. Automat rysuje lakier — my nie.",
    },
    {
      icon: MapPin,
      title: "10 minut od Łącka",
      text: "Czerniec 72 zamiast dwóch kursów po 25 km do Sącza.",
    },
  ];

  // Jawne zawężenie oferty. Powiedzenie wprost, czego NIE robimy (i kto robi to
  // lepiej), kosztuje zlecenia, których i tak byśmy nie obsłużyli, a kupuje
  // wiarygodność wszystkiego powyżej. Bez tego lista zalet czyta się jak
  // samochwalstwo — z tym czyta się jak rozmowa z fachowcem.
  const czegoNieRobimy = [
    "Powłok ceramicznych i PPF — to teren studiów z akredytacjami i portfolio. My robimy wnętrza.",
    "Dojazdu do klienta. Pracujemy stacjonarnie w Czerńcu 72 — dlatego cena z cennika jest ostateczna, bez doliczonych kilometrów.",
    "Obietnicy, że każda plama zejdzie. Stary barwnik potrafi zostawić ślad i mówimy to przed przyjazdem, nie po zapłacie.",
  ];

  return (
    <section
      id="dlaczego"
      aria-labelledby="dlaczego-heading"
      className="scroll-mt-20 border-y border-border bg-card/40"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="dlaczego-heading"
            className="font-serif text-3xl leading-tight font-medium text-balance md:text-4xl"
          >
            To nie myjnia — i nie „wycena indywidualna"
          </h2>
        </Reveal>

        <RevealStagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point) => (
            <RevealItem key={point.title} className="h-full">
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-6">
                <point.icon
                  className="mt-0.5 size-6 shrink-0 text-primary-strong"
                  aria-hidden
                />
                <div>
                  <h3 className="font-serif text-lg font-medium">
                    {point.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                    {point.text}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Uczciwość o granicach — celowo bez lukru (UVP: „czego nie obiecujemy"). */}
        <Reveal className="mt-10">
          <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
            <h3 className="font-serif text-xl font-medium">
              Czego nie robimy
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-pretty text-muted-foreground">
              Wolimy powiedzieć to teraz niż tłumaczyć się przy odbiorze.
            </p>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {czegoNieRobimy.map((pozycja) => (
                <li key={pozycja} className="flex gap-3">
                  <MinusCircle
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-sm text-pretty text-muted-foreground">
                    {pozycja}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-3xl text-sm text-pretty text-muted-foreground">
              I jeszcze jedno: polerowanie one step usuwa 50–70% rys, nie
              wszystkie. Głębokie — takie, w których paznokieć się zahacza —
              wymagają korekty wieloetapowej albo lakiernika.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
