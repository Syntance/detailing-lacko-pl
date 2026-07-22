import { Banknote, Camera, Droplets, ListChecks, MapPin } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „To nie myjnia — i nie „wycena indywidualna"" — lęk zaufania: „czym się
 * różnisz od myjni i od reszty?" (plan www v2 §5). Pięć obietnic z dowodami
 * + uczciwość o granicach jako wyróżnik, nie słabość.
 */
export function DlaczegoJa() {
  const points = [
    {
      icon: ListChecks,
      title: "Pełny cennik na stronie — jedyni w okolicy",
      text: "Wiesz, ile zapłacisz, zanim napiszesz. Zero „wyceny indywidualnej\".",
    },
    {
      icon: Banknote,
      title: "Płacisz po obejrzeniu efektu",
      text: "Całe ryzyko „nie wyszło\" jest po naszej stronie, nie po twojej. Gotówka lub BLIK przy odbiorze.",
    },
    {
      icon: Camera,
      title: "Zdjęcia przed/po każdego auta",
      text: "Widzisz, za co płacisz, zanim się zdecydujesz.",
    },
    {
      icon: Droplets,
      title: "Ręcznie, chemią ADBL i parą",
      text: "Myjnia automatyczna rysuje lakier. My pracujemy ręcznie: piana, dwa wiadra, mikrofibra, parownica.",
    },
    {
      icon: MapPin,
      title: "Z Czerńca, nie z Sącza",
      text: "10 minut od Łącka zamiast dwóch kursów po 25 km.",
    },
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
        <Reveal className="mt-8">
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground">
            Uczciwie o granicach: one step usuwa 50–70% rys, nie wszystkie.
            „Każda plama zejdzie" to obietnica, której nie składamy — jeśli po
            zdjęciu oceniamy, że nie zejdzie, mówimy to przed przyjazdem.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
