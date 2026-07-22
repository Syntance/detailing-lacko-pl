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
      title: "Cennik na stronie",
      text: "Znasz cenę, zanim napiszesz. Zero „wyceny indywidualnej\".",
    },
    {
      icon: Banknote,
      title: "Płatność po efekcie",
      text: "Nie wyszło? Nie płacisz. Ryzyko jest po naszej stronie.",
    },
    {
      icon: Camera,
      title: "Zdjęcia przed/po",
      text: "Widzisz, za co płacisz.",
    },
    {
      icon: Droplets,
      title: "Ręcznie, nie automatem",
      text: "Piana, dwa wiadra, mikrofibra, parownica. Automat rysuje lakier — my nie.",
    },
    {
      icon: MapPin,
      title: "10 minut od Łącka",
      text: "Czerniec 72 zamiast dwóch kursów do Sącza.",
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
            Uczciwie: one step usuwa 50–70% rys, nie wszystkie. I nie
            obiecujemy, że każda plama zejdzie — jeśli nie zejdzie, powiemy to
            przed przyjazdem.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
