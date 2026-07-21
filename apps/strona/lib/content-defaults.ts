import type { FaqItem } from "@moduly/types";

/**
 * Domyślne FAQ z briefu — używane, dopóki treść nie zostanie nadpisana
 * w panelu Magazyn → CMS → Strona główna.
 */
export const DEFAULT_FAQ: FaqItem[] = [
  {
    id: "schniecie",
    question: "Ile schnie tapicerka po praniu?",
    answer:
      "4–8 godzin latem, do 24h zimą. Auto oddaję wilgotne, ale używalne — najlepiej prać rano.",
    order: 0,
  },
  {
    id: "plamy",
    question: "Czy usuniesz każdą plamę?",
    answer:
      "Większość tak. Po starych plamach z barwników (kawa z mlekiem sprzed roku, farba) mogą zostać ślady — powiem uczciwie przed praniem.",
    order: 1,
  },
  {
    id: "rysy",
    question: "Polerowanie usunie wszystkie rysy?",
    answer:
      "One step usuwa 50–70% rys. Głębokie rysy (paznokieć się zahacza) wymagają korekty dwuetapowej (od 1200 zł, wycena po oględzinach) albo lakiernika — ocenimy na miejscu.",
    order: 2,
  },
  {
    id: "czas",
    question: "Ile to trwa?",
    answer:
      "Wnętrze 3–5h, mycie z woskiem 2–3h, polerowanie cały dzień.",
    order: 3,
  },
  {
    id: "dojazd",
    question: "Przyjeżdżasz do klienta?",
    answer:
      "Na razie nie — pracuję tylko stacjonarnie w Czerńcu 72. Trzeba przyjechać do mnie. Do prania tapicerki potrzebuję dostępu do prądu, więc i tak działam u siebie.",
    order: 4,
  },
  {
    id: "faktura",
    question: "Faktura?",
    answer: "Tak.",
    order: 5,
  },
];
