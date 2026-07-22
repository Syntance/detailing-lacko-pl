import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * „Jak to działa — 3 kroki" — lęk logistyczny: „nie wiem, jak to wygląda".
 * Krok 1 = mechanizm wyceny ze zdjęcia.
 */
export function Proces() {
  const steps = [
    {
      title: "Wysyłasz zdjęcie albo dzwonisz",
      text: "Do 2 h odpisujemy z ceną i terminem. Jeśli plama nie zejdzie — mówimy od razu, nie przy odbiorze.",
    },
    {
      title: "Przywozisz auto do Czerńca",
      text: "Po 16:00 albo w weekend. Termin zwykle w 3–7 dni.",
    },
    {
      title: "Odbierasz i płacisz",
      text: "Gotówka lub BLIK, dopiero gdy zobaczysz efekt.",
    },
  ];

  return (
    <section
      id="proces"
      aria-labelledby="proces-heading"
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="proces-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            Jak to działa — 3 kroki
          </h2>
        </Reveal>

        <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <RevealItem key={step.title} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <span
                  aria-hidden
                  className="font-serif text-4xl font-medium text-primary-strong/80"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-lg font-medium">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Uczciwie o logistyce — schnięcie i brak dojazdów jako świadomy wybór. */}
        <Reveal className="mt-8">
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground">
            Tapicerka schnie 4–8 h (zimą do 24 h) — auto odbierasz używalne, ale
            jeszcze wilgotne. Pracujemy stacjonarnie, bez dojazdów — dlatego
            ceny są stałe.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
