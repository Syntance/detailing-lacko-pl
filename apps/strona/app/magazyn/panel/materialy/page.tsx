import Link from "next/link";
import { ExternalLink, Printer } from "lucide-react";
import { PageHeader } from "@moduly/ui";
import { PLAKATY } from "@/lib/plakaty";

function odmianaKartek(n: number): string {
  if (n === 1) return "1 kartka";
  return n >= 2 && n <= 4 ? `${n} kartki` : `${n} kartek`;
}

export const metadata = { title: "Materiały do druku" };

/** Szerokość miniatury w px — A4 (210 mm ≈ 794 px) pomniejszona do karty. */
const MINIATURA = 240;
const SKALA = MINIATURA / 794;

export default function MaterialyPage() {
  return (
    <div>
      <PageHeader
        title="Materiały do druku"
        description="Plakaty A4 do warsztatu. Cenniki biorą ceny prosto z panelu — po każdej zmianie wystarczy wydrukować je ponownie. Plik PDF pobierzesz przez „Zapisz jako PDF” w oknie drukowania."
      />

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PLAKATY.map((p) => (
          <li
            key={p.id}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex justify-center border-b border-border bg-muted p-4">
              <div
                className="overflow-hidden rounded-sm bg-white shadow-md"
                style={{ width: MINIATURA, height: MINIATURA * (297 / 210) }}
              >
                <iframe
                  src={`/magazyn/druk/${p.id}?podglad=1`}
                  title={`Podgląd: ${p.tytul}`}
                  loading="lazy"
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none origin-top-left border-0"
                  style={{ width: 794, height: 1123, transform: `scale(${SKALA})` }}
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                  {p.marka === "detailing" ? "Detailing" : "Wulkanizacja"} · A4 ·{" "}
                  {odmianaKartek(p.kartki)}
                </p>
                <h2 className="font-semibold">{p.tytul}</h2>
                <p className="text-sm text-pretty text-muted-foreground">{p.opis}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/magazyn/druk/${p.id}?drukuj=1`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Printer className="size-4" aria-hidden />
                  Drukuj / pobierz PDF
                </Link>
                <Link
                  href={`/magazyn/druk/${p.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <ExternalLink className="size-4" aria-hidden />
                  Podgląd
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
