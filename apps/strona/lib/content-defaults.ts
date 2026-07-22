import type { FaqItem } from "@moduly/types";

/**
 * Domyślne FAQ — plan www v2 §6 (pozostałe obiekcje). Używane, dopóki treść
 * nie zostanie nadpisana w panelu Magazyn → CMS → Strona główna.
 * Bez pytania o fakturę — forma działalności niepotwierdzona (plan:
 * „dopóki niepotwierdzona, NIE obiecujemy faktury na stronie").
 */
export const DEFAULT_FAQ: FaqItem[] = [
  {
    id: "schniecie",
    question: "Ile schnie tapicerka po praniu?",
    answer:
      "4–8 godzin latem, do 24 h zimą. Najlepiej prać, gdy auto może u nas chwilę postać.",
    order: 0,
  },
  {
    id: "plamy",
    question: "Czy usuniesz każdą plamę?",
    answer:
      "Większość tak. Stare barwniki (kawa sprzed roku, farba) mogą zostawić ślad — ocenimy to ze zdjęcia i powiemy uczciwie przed przyjazdem.",
    order: 1,
  },
  {
    id: "dojazd",
    question: "Robicie dojazd?",
    answer:
      "Nie — pracujemy wyłącznie stacjonarnie w Czerńcu 72. Dzięki temu cena z cennika jest ostateczna, bez dopłat za kilometry.",
    order: 2,
  },
  {
    id: "termin",
    question: "Kiedy mogę przywieźć auto?",
    answer:
      "Po 16:00 w tygodniu albo w weekend. Termin zwykle w 3–7 dni od kontaktu.",
    order: 3,
  },
  {
    id: "doplata",
    question: "SUV, van, 7 osób?",
    answer:
      "Dopłata +20–40% wg cennika — zawsze ustalona przed rozpoczęciem pracy, nigdy przy odbiorze.",
    order: 4,
  },
  {
    id: "rysy",
    question: "Polerowanie usunie wszystkie rysy?",
    answer:
      "One step usuwa 50–70% rys. Głębokie (paznokieć się zahacza) wymagają korekty wieloetapowej albo lakiernika — powiemy wprost.",
    order: 5,
  },
];
