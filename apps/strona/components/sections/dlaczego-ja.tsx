import { Camera, Droplets, HandCoins, Wrench } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „To nie myjnia — to detailing" — obiekcja: „czym się różnisz od myjni?"
 * (brief §5).
 */
export function DlaczegoJa() {
  const points = [
    {
      icon: Droplets,
      title: "Ręcznie, nie szczotką",
      text: "Myjnia automatyczna rysuje lakier. U mnie każdy etap ręcznie: piana, dwa wiadra, mikrofibra.",
    },
    {
      icon: Wrench,
      title: "Chemia ADBL i profesjonalny sprzęt",
      text: "Ekstraktor do tapicerki, maszyna polerska, chemia dobrana do lakieru i materiału.",
    },
    {
      icon: HandCoins,
      title: "Cena z góry",
      text: "Mówię ile zapłacisz, zanim zacznę. Żadnych niespodzianek przy odbiorze.",
    },
    {
      icon: Camera,
      title: "Zdjęcia przed/po każdego auta",
      text: "Widzisz za co płacisz.",
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
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            To nie myjnia — to detailing
          </h2>
        </Reveal>

        <RevealStagger className="mt-10 grid gap-5 sm:grid-cols-2">
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
      </div>
    </section>
  );
}
