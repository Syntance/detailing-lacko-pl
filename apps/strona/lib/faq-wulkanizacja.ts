import type { FaqData } from "./faq";

/**
 * FAQ linii Wulkanizacja — blob `faq-wulkanizacja` (panel Magazyn →
 * Wulkanizacja → FAQ). Kolejność jak w FAQ detailingu: najpierw realne
 * dylematy klienta (kiedy, co wybrać), potem logistyka. Odpowiedzi edukują
 * i mówią wprost, czego NIE robimy — to buduje więcej zaufania niż obietnice.
 *
 * Kwot tu nie ma celowo: odpowiedzi odsyłają do cennika, żeby zmiana cen
 * w panelu nie zostawiała w FAQ starych liczb.
 */
export const DEFAULT_FAQ_WULKANIZACJA: FaqData = {
  items: [
    {
      id: "kiedy-zimowe",
      question: "Kiedy zmieniać opony na zimowe, a kiedy z powrotem na letnie?",
      answer:
        "Gdy poranna temperatura na stałe spada poniżej 7°C — w Łącku to zwykle końcówka października. Wiosną odwrotnie: kiedy noce są już powyżej 7°C. Nie czekaj na pierwszy śnieg, bo wtedy wszyscy dzwonią naraz — zadzwoń kilka dni wcześniej, a umówiona godzina będzie tylko Twoja.",
      order: 0,
    },
    {
      id: "na-felgach-czy-przekladka",
      question: "Dwa komplety kół czy przekładanie opon na jednych felgach?",
      answer:
        "Dwa komplety (opony na felgach) to szybka przekładka: 4 koła zdjąć, założyć, wyważyć — ok. 45 minut i mniejszy koszt co sezon. Jeden komplet felg oznacza ściąganie i zakładanie opon na te same felgi: dłużej, drożej i opona za każdym razem trochę cierpi. Różnicę dla swojego rozmiaru felgi zobaczysz w cenniku — przekładka i wymiana opon stoją obok siebie.",
      order: 1,
    },
    {
      id: "wywazanie-zawsze",
      question: "Czy przy każdej wymianie trzeba wyważać?",
      answer:
        "Tak — i dlatego wyważanie jest w cenie wymiany, a nie dopłatą. Ciężarki się gubią, opona zużywa się nierówno, a niewyważone koło to drżąca kierownica przy 100 km/h i szybciej zużyte zawieszenie.",
      order: 2,
    },
    {
      id: "przebita",
      question: "Mam przebitą oponę. Da się to naprawić?",
      answer:
        "Zwykle tak. Gwóźdź albo wkręt w bieżniku zakleję kołkiem (sznurem) bez zdejmowania opony albo naprawię od środka grzybkiem — z demontażem i wyważeniem. Obie naprawy mają cenę w cenniku, a ja podpowiem, która ma sens w Twoim przypadku. Nie naprawiam boku opony ani dziur powyżej 6 mm — wtedy opona idzie do wymiany i powiem to od razu, zanim policzę cokolwiek. Nie jedź długo na spuszczonym kole: bok niszczy się w kilka kilometrów.",
      order: 3,
    },
    {
      id: "przechowywanie",
      question: "Mogę zostawić drugi komplet kół u was?",
      answer:
        "Tak — same opony albo całe koła na felgach. Komplet trafia opisany do suchego magazynu i czeka na kolejną przekładkę — płacisz za sezon (ok. 6 miesięcy), odbierasz przy następnej wymianie. Koniec z noszeniem kół do piwnicy i błotem w bagażniku.",
      order: 4,
    },
    {
      id: "wlasne-opony",
      question: "Mogę przyjechać z własnymi oponami?",
      answer:
        "Oczywiście — montuję opony kupione gdziekolwiek, bez dopłaty za „obce”. Jeśli nie wiesz, co wybrać, napisz przed zakupem: podpowiem rozmiar z tabliczki i sensowne modele w Twoim budżecie.",
      order: 5,
    },
    {
      id: "ile-trwa",
      question: "Ile to trwa i czy muszę czekać?",
      answer:
        "Przekładka kompletnych kół ok. 45 minut, wymiana opon na felgach ok. godziny. Przyjeżdżasz na umówioną telefonicznie godzinę i auto robię od razu — możesz poczekać na miejscu albo skoczyć do sklepu.",
      order: 6,
    },
    {
      id: "suv-runflat",
      question: "SUV, dostawczak, opony run-flat?",
      answer:
        "Robię. SUV i 4x4, run-flat, niski profil i dostawcze na oponach C wymagają więcej pracy na maszynie — dopłaty za komplet masz w cenniku, a duże felgi mają swoje ceny w tabeli rozmiarów. Znasz je przed rozpoczęciem, nie przy odbiorze.",
      order: 7,
    },
    {
      id: "z-detailingiem",
      question: "Da się połączyć wymianę z myciem albo detailingiem?",
      answer:
        "Tak. Mycie kół dorzucisz do przekładki — jest w cenniku wulkanizacji wśród usług dodatkowych. Pranie tapicerki, kompleksowe wnętrze czy polerowanie umawiasz na stronie Detailing Łącko — najlepiej na ten sam dzień, auto i tak stoi u nas.",
      order: 8,
    },
  ],
};
