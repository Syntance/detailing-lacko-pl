/**
 * Materiały do druku (A4) — lista plakatów w panelu Magazyn → Materiały do
 * druku. Każdy renderuje się na żywo z danych panelu (/magazyn/druk/[id]),
 * więc po zmianie ceny wystarczy wydrukować ponownie.
 */

export type Marka = "detailing" | "wulkanizacja";

export type Plakat = {
  id: string;
  tytul: string;
  opis: string;
  marka: Marka;
  kartki: number;
};

export const PLAKATY: Plakat[] = [
  {
    id: "cennik-detailing",
    tytul: "Cennik · Detailing",
    opis: "Wszystkie usługi detailingu z cenami i pakietami — z aktualnego cennika w panelu.",
    marka: "detailing",
    kartki: 1,
  },
  {
    id: "cennik-wulkanizacja",
    tytul: "Cennik · Wulkanizacja",
    opis: "Przekładka, wymiana, naprawy, TPMS, hotel i dopłaty — z aktualnego cennika w panelu.",
    marka: "wulkanizacja",
    kartki: 1,
  },
  {
    id: "tabele-napraw",
    tytul: "Tabele napraw opon · komplet",
    opis: "Jeden plik, 5 kartek: kwalifikacja opony do naprawy, wspólna legenda oznaczeń, osobowe i dostawcze na jednej kartce oraz przyczepy i autobusy (klucz rozmiarów i limity) na dwóch. Materiał wewnętrzny.",
    marka: "wulkanizacja",
    kartki: 5,
  },
  {
    id: "momenty-kol",
    tytul: "Momenty dokręcania kół (Nm)",
    opis: "Ściąga: ile Nm kręcić na markach i modelach, z oznaczeniem rozbieżności między źródłami, procedurą dokręcania i listą marek bez danych. Wartości orientacyjne — obowiązuje instrukcja pojazdu. Materiał wewnętrzny.",
    marka: "wulkanizacja",
    kartki: 5,
  },
  {
    id: "momenty-srub",
    tytul: "Momenty dokręcania śrub (Nm)",
    opis: "Momenty dla śrub stalowych wg klasy 8.8 / 10.9 / 12.9, gwint zwykły M4–M24 i drobny M8×1–M24×2 (skoki 1 / 1,25 / 1,5 / 2) — min, zalecany i maks osobno dla śruby suchej i smarowanej; świece, sonda lambda i śruby tylko wg producenta. Materiał wewnętrzny.",
    marka: "wulkanizacja",
    kartki: 5,
  },
];

export const plakatPoId = (id: string) => PLAKATY.find((p) => p.id === id) ?? null;
