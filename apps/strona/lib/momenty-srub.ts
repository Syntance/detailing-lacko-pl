/**
 * Momenty dokręcania śrub ogólnie (poza kołami — te są w `momenty-kol.ts`).
 *
 * Tabela klas wytrzymałości: maksymalne momenty dla śrub stalowych z gwintem
 * metrycznym (ISO 898-1) przy współczynniku tarcia µ 0,12–0,14 (gwint suchy
 * lub lekko naoliwiony, śruba ocynkowana). Przedział [min, max] = µ 0,12 → 0,14
 * wg TR Fastenings i Roloff/Matek (tabela Zimmer Group, µ 0,12 — te same liczby
 * co kolumna µ 0,125 u TR). Gwint drobny tylko z TR Fastenings.
 *
 * Elementy samochodu: wpisujemy tylko to, co znaleźliśmy w otwartych źródłach.
 * Hamulce, zawieszenie, układ kierowniczy, korek oleju itp. różnią się między
 * modelami tak bardzo (np. jarzmo zacisku 110 Nm albo 180 Nm + kąt), że tabela
 * „typowych" wartości byłaby myląca — zamiast liczb jest lista, gdzie ich szukać.
 */

export type Klasa = "8.8" | "10.9" | "12.9";
export const KLASY: Klasa[] = ["8.8", "10.9", "12.9"];

export type WierszGwintu = { gwint: string; nm: Record<Klasa, [number, number]> };

const r = (
  gwint: string,
  k88: [number, number],
  k109: [number, number],
  k129: [number, number],
): WierszGwintu => ({ gwint, nm: { "8.8": k88, "10.9": k109, "12.9": k129 } });

export const GWINT_ZWYKLY: WierszGwintu[] = [
  r("M5", [5.8, 6.2], [8.1, 8.7], [9.7, 10.4]),
  r("M6", [9.9, 10.5], [14, 15], [16.5, 18]),
  r("M8", [24, 26], [34, 36], [40, 43]),
  r("M10", [48, 51], [67, 72], [81, 87]),
  r("M12", [83, 89], [117, 125], [140, 150]),
  r("M14", [132, 141], [185, 198], [220, 240]),
  r("M16", [200, 215], [285, 305], [340, 365]),
  r("M20", [390, 420], [550, 590], [660, 710]),
];

/** Jedno źródło (TR Fastenings), wartości zaokrąglone do 5 Nm. */
export const GWINT_DROBNY: WierszGwintu[] = [
  r("M10×1,25", [49, 52], [68, 73], [82, 88]),
  r("M12×1,25", [88, 95], [125, 135], [150, 160]),
  r("M14×1,5", [140, 150], [195, 210], [235, 250]),
];

export type WpisElementu = {
  element: string;
  nm: [number, number];
  uwaga?: string;
  /** Jedno źródło albo źródła wyraźnie się różnią — na plakacie wyróżnione. */
  niepewny?: boolean;
};

export type GrupaElementow = { nazwa: string; opis?: string; wpisy: WpisElementu[] };

export const ELEMENTY: GrupaElementow[] = [
  {
    nazwa: "Świece zapłonowe — gniazdo płaskie (z uszczelką)",
    opis: "Nowa świeca: po wkręceniu ręką dokręć o 1/2–2/3 obrotu (NGK).",
    wpisy: [
      { element: "M14 · głowica aluminiowa", nm: [25, 30] },
      { element: "M14 · głowica żeliwna", nm: [25, 35] },
      { element: "M12 · głowica aluminiowa", nm: [15, 20] },
      { element: "M12 · głowica żeliwna", nm: [15, 25] },
      { element: "M10 · głowica aluminiowa", nm: [10, 12] },
      { element: "M10 · głowica żeliwna", nm: [10, 15] },
    ],
  },
  {
    nazwa: "Świece zapłonowe — gniazdo stożkowe (bez uszczelki)",
    opis: "Po wkręceniu ręką dokręć tylko ok. 1/16 obrotu (NGK).",
    wpisy: [
      { element: "M14 · głowica aluminiowa", nm: [10, 20] },
      { element: "M14 · głowica żeliwna", nm: [15, 25] },
      { element: "M12 · głowica aluminiowa", nm: [10, 20] },
    ],
  },
  {
    nazwa: "Świece żarowe",
    opis: "Gdy producent auta podaje inną wartość — obowiązuje ona (Bosch).",
    wpisy: [
      { element: "M8", nm: [6, 10], niepewny: true },
      { element: "M10", nm: [10, 15], niepewny: true },
      { element: "M12", nm: [15, 25], niepewny: true },
    ],
  },
  {
    nazwa: "Sonda lambda",
    wpisy: [
      {
        element: "M18×1,5",
        nm: [35, 60],
        niepewny: true,
        uwaga: "źródła się różnią: 35–45 Nm (Lambda Power) i 50–60 Nm (Bosch)",
      },
    ],
  },
];

/** Śruby, których nie dokręca się „z tabeli". */
export const TYLKO_PRODUCENT: { co: string; dlaczego: string }[] = [
  {
    co: "Śruby głowicy, korbowodów i panewek głównych",
    dlaczego: "moment + kąt (np. 45 Nm + 90° + 90°); śruby rozciągają się raz — jednorazowe",
  },
  {
    co: "Koło zamachowe, koło pasowe wału, koło rozrządu",
    dlaczego: "zwykle moment + kąt; sprawdź w danych producenta, czy śruby nie są jednorazowe",
  },
  {
    co: "Nakrętki piast i półosi",
    dlaczego: "moment zależy od modelu; często nakrętka jednorazowa, zakuwana",
  },
  {
    co: "Hamulce: jarzma i prowadnice zacisku, śruby banjo",
    dlaczego: "wartości bardzo różne między modelami, część na kąt — tylko dane producenta",
  },
  {
    co: "Zawieszenie i układ kierowniczy",
    dlaczego: "wahacze, zwrotnice, końcówki drążków — dane producenta; śruby tulei gumowych często dokręca się na kołach",
  },
  {
    co: "Gwinty w aluminium (miska olejowa, głowica, obudowy)",
    dlaczego: "moment ogranicza gwint w aluminium, nie klasa śruby — tabela klas nie ma zastosowania",
  },
];

export const ZASADY = [
  "Klasa jest wybita na łbie śruby: 8.8, 10.9 lub 12.9. Bez oznaczenia — nie zakładaj wyższej niż 8.8.",
  "Tabela klas podaje momenty maksymalne — to górna granica, nie wartość „na zapas”.",
  "Gwint czysty, suchy lub lekko naoliwiony. Przy smarze lub paście (µ ok. 0,10) moment ok. 10–15% niższy.",
  "Gdy producent auta lub części podaje moment, obowiązuje on, nie ta tabela.",
  "Kluczem dynamometrycznym pracuj w środku jego zakresu (ok. 20–80%), po pracy odkręć nastawę do zera.",
];

export const GDZIE_SZUKAC = [
  "dane serwisowe producenta auta (instrukcja serwisowa, portal serwisowy marki)",
  "bazy warsztatowe: Autodata, HaynesPro, TecRMI",
  "instrukcja w opakowaniu części — klocki, wahacze, łączniki często mają podany moment",
];

export const ZRODLA_SRUB = [
  "TR Fastenings — Pre-load and tightening torques, coarse / fine metric threads (trfastenings.com)",
  "Zimmer Group za Roloff/Matek, Maschinenelemente Tabellenbuch, wyd. 19 (zimmer-group.com)",
  "NGK — Spark plug installation (ngksparkplugs.com) i tabela NGK w Nm",
  "Bosch — momenty świec żarowych (za buycarparts.co.uk); Lambda Power — fitting guide (lambdapower.co.uk)",
  "AA1Car — Torque-to-yield head bolts (aa1car.com)",
];

export const nm = ([min, max]: [number, number]) => {
  const f = (n: number) => String(n).replace(".", ",");
  return min === max ? f(min) : `${f(min)}–${f(max)}`;
};
