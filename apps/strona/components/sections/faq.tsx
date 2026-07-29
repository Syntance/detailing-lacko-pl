import type { FaqItem } from "@moduly/types";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * FAQ 1:1 z makietą „kreskówka": żółte tło w kropkowaną siatkę, a pytania
 * jako białe karty z twardą kreską i cieniem — pytanie i odpowiedź widoczne
 * od razu. Makieta nie ma akordeonu (poprzednia wersja miała), więc sekcja
 * jest serwerowa: zero JS, całe FAQ w HTML od pierwszego renderu (bonus dla
 * SEO/GEO). Treść z panelu Magazyn → FAQ.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  if (!sorted.length) return null;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="kropki scroll-mt-24 border-t-[3px] border-ink bg-zolty"
    >
      <div className="mx-auto flex max-w-[900px] flex-col gap-[30px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal>
          <h2
            id="faq-heading"
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
          >
            Częste pytania
          </h2>
        </Reveal>

        <RevealStagger className="flex flex-col gap-3.5">
          {sorted.map((item) => (
            <RevealItem key={item.id}>
              <div className="cien-4 flex flex-col gap-1.5 rounded-[14px] border-[3px] border-ink bg-background px-[21px] py-[17px]">
                <h3 className="text-base font-bold">{item.question}</h3>
                <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
                  {item.answer}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
