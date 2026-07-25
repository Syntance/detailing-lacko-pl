import { z } from "zod";

/**
 * FAQ — sekcja „Częste pytania" (plan www v2 §6). Edycja: panel Magazyn →
 * FAQ. Storage: `site_blobs`, klucz `faq`. Treść startowa = to, co wcześniej
 * żyło na sztywno w kodzie (content-defaults.ts).
 */
export const faqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1, "Pytanie jest wymagane"),
  answer: z.string().min(1, "Odpowiedź jest wymagana"),
  order: z.number().int(),
});

export const faqDataSchema = z.object({
  items: z.array(faqItemSchema),
});

export type FaqItemInput = z.infer<typeof faqItemSchema>;
export type FaqData = z.infer<typeof faqDataSchema>;

/**
 * Kolejność FAQ = kolejność realnych obiekcji, nie kolejność tematów.
 * Pierwsze dwa pytania to porównanie z alternatywami, które klient rozważa
 * naprawdę: myjnia samoobsługowa za 30 zł i „nie robię nic". Dopiero potem
 * logistyka. Odpowiedzi edukują (jak działa problem), zamiast przekonywać.
 */
export const DEFAULT_FAQ: FaqData = {
  items: [
    {
      id: "myjnia",
      question: "Czym to się różni od myjni samoobsługowej za 30 zł?",
      answer:
        "Myjnia robi karoserię — do wnętrza nie wchodzi. Plama i zapach siedzą w gąbce pod tapicerką i żeby je stamtąd wyciągnąć, trzeba prania na mokro, pary i kilku godzin. To dwie różne roboty, nie dwie ceny za to samo. Jeśli chodzi Ci tylko o umytą blachę — myjnia wystarczy i szkoda pieniędzy na nas.",
      order: 0,
    },
    {
      id: "oplacalnosc",
      question: "Czy to się opłaca przy aucie za 20 tysięcy?",
      answer:
        "Jeśli je sprzedajesz — kupujący zbije cenę o brudne wnętrze mocniej, niż kosztuje jego wyczyszczenie. Jeśli je zatrzymujesz — jeździsz nim codziennie i wozisz w nim ludzi. Jeśli auto idzie za miesiąc na złom, powiemy wprost, żeby sobie odpuścić.",
      order: 1,
    },
    {
      id: "plamy",
      question: "Czy usuniesz każdą plamę?",
      answer:
        "Większość tak. Stare barwniki (kawa sprzed roku, farba) mogą zostawić ślad — ocenimy to ze zdjęcia i powiemy przed przyjazdem, a nie po zapłacie.",
      order: 2,
    },
    {
      id: "zapach",
      question: "Auto śmierdzi psem i papierosami. Da się to usunąć?",
      answer:
        "Tak, ale nie odświeżaczem. Zapach to bakterie w wilgotnej gąbce siedzeń i osad na podsufitce — pranie usuwa źródło, ozonowanie (+80 zł) dobija resztę. Odświeżacz tylko przykrywa problem na tydzień.",
      order: 3,
    },
    {
      id: "schniecie",
      question: "Ile schnie tapicerka po praniu?",
      answer:
        "4–8 godzin latem, do 24 h zimą. Auto odbierasz używalne, ale jeszcze wilgotne — najlepiej prać wtedy, gdy może u nas chwilę postać.",
      order: 4,
    },
    {
      id: "dojazd",
      question: "Robicie dojazd?",
      answer:
        "Nie — pracujemy wyłącznie stacjonarnie w Czerńcu 72. Dzięki temu cena z cennika jest ostateczna, bez doliczonych kilometrów. Jeśli potrzebujesz dojazdu pod dom, w okolicy są firmy, które to robią.",
      order: 5,
    },
    {
      id: "termin",
      question: "Kiedy mogę przywieźć auto?",
      answer:
        "Po 16:00 w tygodniu albo w weekend. Termin zwykle w 3–7 dni od kontaktu.",
      order: 6,
    },
    {
      id: "doplata",
      question: "SUV, van, 7 osób?",
      answer:
        "Dopłata +20–40% wg cennika — zawsze ustalona przed rozpoczęciem pracy, nigdy przy odbiorze.",
      order: 7,
    },
    {
      id: "rysy",
      question: "Polerowanie usunie wszystkie rysy?",
      answer:
        "One step usuwa 50–70% rys. Głębokie (paznokieć się zahacza) wymagają korekty wieloetapowej albo lakiernika — powiemy wprost, jeśli tak jest.",
      order: 8,
    },
  ],
};
