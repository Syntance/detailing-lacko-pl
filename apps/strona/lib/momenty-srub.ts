/**
 * Momenty dokręcania śrub ogólnie (poza kołami — te są w `momenty-kol.ts`).
 *
 * Tabela klas: moment montażowy śrub stalowych z gwintem metrycznym przy 90%
 * granicy plastyczności, wg VDI 2230 (Würth Industrie, DINO rozdz. 6, tab. 5 i 6).
 * Moment zależy od tarcia w gwincie, więc każdy stan gwintu ma trzy wartości
 * z tej samej tabeli, dla trzech współczynników tarcia:
 * - śruba sucha (ocynk bez smaru): µ 0,12 / 0,14 / 0,16 — zalecany 0,14 (przykład Würth),
 * - śruba smarowana (olej, smar, pasta): µ 0,08 / 0,10 / 0,12.
 * Kontrola: dla µ 0,12 wartości zgadzają się z tabelami ISO 4014/4762 (np. M8 10.9 = 36,1 Nm).
 * Na plakacie bez listy źródeł — na prośbę warsztatu.
 *
 * Elementy samochodu: tylko to, co jest w tabelach producentów części (świece NGK,
 * świece żarowe Bosch, sonda lambda: Lambda Power vs Bosch). Hamulce, zawieszenie,
 * piasty itp. różnią się między modelami zbyt mocno na tabelę „typowych" wartości.
 */

export type Klasa = "8.8" | "10.9" | "12.9";
export const KLASY: Klasa[] = ["8.8", "10.9", "12.9"];

export type StanGwintu = "sucho" | "smar";
/** [min, zalecany, maks] w Nm. */
export type TrzyMomenty = [number, number, number];
type Klasy = Record<Klasa, TrzyMomenty>;
export type WierszGwintu = { gwint: string } & Record<StanGwintu, Klasy>;

const klasy = ([k88, k109, k129]: [TrzyMomenty, TrzyMomenty, TrzyMomenty]): Klasy => ({
  "8.8": k88,
  "10.9": k109,
  "12.9": k129,
});

const r = (
  gwint: string,
  sucho: [TrzyMomenty, TrzyMomenty, TrzyMomenty],
  smar: [TrzyMomenty, TrzyMomenty, TrzyMomenty],
): WierszGwintu => ({ gwint, sucho: klasy(sucho), smar: klasy(smar) });

export const GWINT_ZWYKLY: WierszGwintu[] = [
  r("M4", [[3, 3.3, 3.6], [4.6, 4.8, 5.3], [5.1, 5.6, 6.2]], [[2.3, 2.6, 3], [3.3, 3.9, 4.6], [3.9, 4.5, 5.1]]),
  r("M5", [[5.9, 6.5, 7.1], [8.6, 9.5, 10.4], [10, 11.2, 12.2]], [[4.4, 5.2, 5.9], [6.5, 7.6, 8.6], [7.6, 8.9, 10]]),
  r("M6", [[10.1, 11.3, 12.3], [14.9, 16.5, 18], [17.4, 19.3, 21.1]], [[7.7, 9, 10.1], [11.3, 13.2, 14.9], [13.2, 15.4, 17.4]]),
  r("M7", [[16.8, 18.7, 20.5], [24.7, 27.5, 30.1], [28.9, 32.2, 35.2]], [[12.6, 14.8, 16.8], [18.5, 21.7, 24.7], [21.6, 25.4, 28.9]]),
  r("M8", [[24.6, 27.3, 29.8], [36.1, 40.1, 43.8], [42.2, 46.9, 51.2]], [[18.5, 21.6, 24.6], [27.2, 31.8, 36.1], [31.8, 37.2, 42.2]]),
  r("M10", [[48, 54, 59], [71, 79, 87], [83, 93, 101]], [[36, 43, 48], [53, 63, 71], [62, 73, 83]]),
  r("M12", [[84, 93, 102], [123, 137, 149], [144, 160, 175]], [[63, 73, 84], [92, 108, 123], [108, 126, 144]]),
  r("M14", [[133, 148, 162], [195, 218, 238], [229, 255, 279]], [[100, 117, 133], [146, 172, 195], [171, 201, 229]]),
  r("M16", [[206, 230, 252], [302, 338, 370], [354, 395, 433]], [[153, 180, 206], [224, 264, 302], [262, 309, 354]]),
  r("M18", [[295, 329, 360], [421, 469, 513], [492, 549, 601]], [[220, 259, 295], [314, 369, 421], [367, 432, 492]]),
  r("M20", [[415, 464, 509], [592, 661, 725], [692, 773, 848]], [[308, 363, 415], [438, 517, 592], [513, 605, 692]]),
  r("M22", [[567, 634, 697], [807, 904, 993], [945, 1057, 1162]], [[417, 495, 567], [595, 704, 807], [696, 824, 945]]),
  r("M24", [[714, 798, 875], [1017, 1136, 1246], [1190, 1329, 1458]], [[529, 625, 714], [754, 890, 1017], [882, 1041, 1190]]),
];

export const GWINT_DROBNY: WierszGwintu[] = [
  r("M8×1", [[26.1, 29.2, 32], [38.3, 42.8, 47], [44.9, 50.1, 55]], [[19.3, 22.8, 26.1], [28.4, 33.5, 38.3], [33.2, 39.2, 44.9]]),
  r("M10×1", [[53, 60, 66], [78, 88, 97], [91, 103, 113]], [[39, 46, 53], [57, 68, 78], [67, 80, 91]]),
  r("M10×1,25", [[51, 57, 62], [75, 83, 92], [87, 98, 107]], [[38, 44, 51], [55, 65, 75], [65, 76, 87]]),
  r("M12×1,25", [[90, 101, 111], [133, 149, 164], [155, 174, 192]], [[66, 79, 90], [97, 116, 133], [114, 135, 155]]),
  r("M12×1,5", [[87, 97, 107], [128, 143, 157], [150, 167, 183]], [[64, 76, 87], [95, 112, 128], [111, 131, 150]]),
  r("M14×1,5", [[142, 159, 175], [209, 234, 257], [244, 274, 301]], [[104, 124, 142], [153, 182, 209], [179, 213, 244]]),
  r("M16×1,5", [[218, 244, 269], [320, 359, 396], [374, 420, 463]], [[159, 189, 218], [233, 278, 320], [273, 325, 374]]),
  r("M18×1,5", [[327, 368, 406], [465, 523, 578], [544, 613, 676]], [[237, 283, 327], [337, 403, 465], [394, 472, 544]]),
  r("M20×1,5", [[454, 511, 565], [646, 728, 804], [756, 852, 941]], [[327, 392, 454], [466, 558, 646], [545, 653, 756]]),
  r("M22×1,5", [[613, 692, 765], [873, 985, 1090], [1022, 1153, 1275]], [[440, 529, 613], [627, 754, 873], [734, 882, 1022]]),
];

export type WpisElementu = {
  element: string;
  nm: [number, number];
  /** Jedno źródło albo źródła wyraźnie się różnią — na plakacie wyróżnione. */
  niepewny?: boolean;
};

export type GrupaElementow = { nazwa: string; opis?: string; wpisy: WpisElementu[] };

export const ELEMENTY: GrupaElementow[] = [
  {
    nazwa: "Świece zapłonowe · gniazdo płaskie",
    opis: "nowa świeca: ręką + 1/2–2/3 obrotu",
    wpisy: [
      { element: "M14 · głowica alu", nm: [25, 30] },
      { element: "M14 · głowica żeliwna", nm: [25, 35] },
      { element: "M12 · głowica alu", nm: [15, 20] },
      { element: "M12 · głowica żeliwna", nm: [15, 25] },
      { element: "M10 · głowica alu", nm: [10, 12] },
      { element: "M10 · głowica żeliwna", nm: [10, 15] },
    ],
  },
  {
    nazwa: "Świece zapłonowe · gniazdo stożkowe",
    opis: "ręką + ok. 1/16 obrotu",
    wpisy: [
      { element: "M14 · głowica alu", nm: [10, 20] },
      { element: "M14 · głowica żeliwna", nm: [15, 25] },
      { element: "M12 · głowica alu", nm: [10, 20] },
    ],
  },
  {
    nazwa: "Świece żarowe",
    wpisy: [
      { element: "M8", nm: [6, 10], niepewny: true },
      { element: "M10", nm: [10, 15], niepewny: true },
      { element: "M12", nm: [15, 25], niepewny: true },
    ],
  },
  {
    nazwa: "Sonda lambda",
    wpisy: [{ element: "M18×1,5", nm: [35, 60], niepewny: true }],
  },
];

/** Śruby, których nie dokręca się „z tabeli". */
export const TYLKO_PRODUCENT: { co: string; dlaczego: string }[] = [
  { co: "Głowica, korbowody, panewki", dlaczego: "moment + kąt, śruby jednorazowe" },
  { co: "Koło zamachowe, koło pasowe wału, rozrząd", dlaczego: "zwykle moment + kąt" },
  { co: "Nakrętki piast i półosi", dlaczego: "często jednorazowe, zakuwane" },
  { co: "Zaciski hamulcowe, śruby banjo", dlaczego: "bardzo różne między modelami" },
  { co: "Wahacze, zwrotnice, drążki", dlaczego: "tuleje gumowe często dokręca się na kołach" },
  { co: "Gwinty w aluminium", dlaczego: "decyduje gwint, nie klasa śruby" },
];

export const ZASADY = [
  "Klasa jest na łbie śruby. Bez oznaczenia — licz jak 8.8.",
  "Kręć na zieloną wartość. Maks — nigdy więcej.",
  "Śruba z olejem, smarem lub pastą — kartka „śruba smarowana”.",
  "Moment od producenta auta lub części ma pierwszeństwo.",
]

export const liczba = (n: number) => String(n).replace(".", ",");

export const nm = ([min, max]: [number, number]) =>
  min === max ? liczba(min) : `${liczba(min)}–${liczba(max)}`;
