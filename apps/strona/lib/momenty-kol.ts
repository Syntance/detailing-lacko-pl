/**
 * Orientacyjne momenty dokręcania kół (Nm) zestawione z publicznych źródeł:
 * dokumentów producentów tam, gdzie były dostępne (instrukcja Forda Transit,
 * dokument Toyota Europe), baz modeli (wheel-size.com, PureTyre), tabel
 * serwisów oponiarskich (pneufrank.ch, drehmoment-schluessel.de, eTOMNAR,
 * Betafer, Airsus, Megatool, OponyAlbert) i — przy busach — forów z cytatami
 * instrukcji. Lista źródeł do druku: `ZRODLA`.
 *
 * Zasada: gdy źródła podają tę samą wartość, wpis ma jedną liczbę. Gdy się
 * różnią, wpis ma przedział [min, max] z porównania źródeł. Wpis z jednego
 * źródła jest oznaczony `jednoZrodlo`. Na plakacie oba przypadki są wyróżnione,
 * a obowiązuje instrukcja pojazdu / dane producenta felg. Nie wpisujemy
 * niczego, czego żadne źródło nie podaje (lista `BEZ_DANYCH`).
 */

export type WpisMomentu = {
  modele: string;
  /** [min, max]; równe = wszystkie źródła się zgadzają. */
  nm: [number, number];
  uwaga?: string;
  /** Wpis pochodzi tylko z jednego źródła — nie ma z czym go porównać. */
  jednoZrodlo?: boolean;
};

export type MarkaMomentow = {
  marka: string;
  wpisy: WpisMomentu[];
};

const w = (modele: string, min: number, max: number = min, uwaga?: string): WpisMomentu => ({
  modele,
  nm: [min, max],
  uwaga,
});

/** Wpis z jednego źródła (niezweryfikowany porównaniem). */
const j = (modele: string, min: number, max: number = min, uwaga?: string): WpisMomentu => ({
  ...w(modele, min, max, uwaga),
  jednoZrodlo: true,
});

/** Do zaznaczenia w tabeli: źródła się różnią albo jest tylko jedno. */
export const rozbiezny = (wpis: WpisMomentu) => wpis.nm[0] !== wpis.nm[1] || Boolean(wpis.jednoZrodlo);

const MARKI_KOL: MarkaMomentow[] = [
  {
    marka: "Alfa Romeo",
    wpisy: [
      w("MiTo, Giulietta", 90, 120, "źródła przypisują 90 i 120 Nm odwrotnie felgom stalowym i alu"),
      w("147, 156, 166, Spider/GTV", 100),
      w("159, Brera", 120),
      w("GT", 84, 100),
      w("Giulia, Stelvio", 120, 140),
      w("Tonale", 120),
    ],
  },
  {
    marka: "Audi",
    wpisy: [
      w("A1, A3, A4, A5, A6, A7, TT, Q2", 120, 130, "jedno źródło podaje 130 Nm dla felg aluminiowych"),
      w("Q3, Q5", 140),
      w("Q7", 160),
      w("Q4 e-tron", 120),
      w("Q8 e-tron", 140),
    ],
  },
  {
    marka: "BMW",
    wpisy: [
      w("Serie 1, 3 (E), Z4, X1 (E84)", 120, 140, "jedno źródło podaje 140 Nm także dla serii 3 E46/E90"),
      w("Serie F / G, X3, X5, X6", 140),
      w("X1, iX1, X2 (2016+)", 140),
      w("i4, i5, iX, iX3", 140),
    ],
  },
  {
    marka: "Citroën",
    wpisy: [
      w("C2, DS3, Xsara, Nemo", 90),
      w("C3, C4, C5, Berlingo, Picasso", 90, 110),
      w("C3 Aircross, C3 (nowe), ë-C3", 100),
      w("C5 Aircross", 100, 120),
      w("C8, Jumpy, Expert", 110),
    ],
  },
  {
    marka: "Bentley / Chrysler",
    wpisy: [
      j("Bentley (obecne modele)", 130),
      w("Chrysler 300C, SRT8", 150),
      w("Chrysler Crossfire", 110),
      w("Chrysler — pozostałe modele", 135),
    ],
  },
  {
    marka: "BYD",
    wpisy: [
      w("Atto 3", 120, 130),
      j("Dolphin", 120),
      w("Seal", 130),
      j("Sealion", 130),
    ],
  },
  {
    marka: "Chevrolet",
    wpisy: [
      w("Aveo (do 2011), Kalos, Epica", 120),
      j("Aveo T300 (2011+)", 140),
      j("Cruze", 140),
      j("Spark", 120),
      w("Captiva", 125, 140),
      j("Orlando", 140),
    ],
  },
  {
    marka: "Cupra",
    wpisy: [w("Formentor", 120, 140), w("Born", 120), w("Tavascan", 140)],
  },
  {
    marka: "Dacia",
    wpisy: [
      w("Logan, Sandero", 105),
      w("Duster, Dokker, Lodgy", 105, 110),
      w("Jogger", 105, 110),
      w("Spring", 110),
      w("Bigster", 110, 120),
    ],
  },
  {
    marka: "DS",
    wpisy: [w("DS 3, DS 4, DS 7", 100, 120)],
  },
  {
    marka: "Fiat",
    wpisy: [
      w("Panda, 500, Bravo, Doblo, Tipo", 90, 110, "90 Nm stal / 98 Nm alu wg części źródeł, inne podają 110"),
      w("Idea, Stilo", 98),
      w("Punto, Grande Punto, Croma, Ulysse", 90, 110),
      w("500X", 110),
      w("Freemont", 135),
      w("500e, 600, 600e", 98, 120),
    ],
  },
  {
    marka: "Ford",
    wpisy: [
      w("Ka, Fusion", 100),
      w("Fiesta", 90, 140, "wg jednego źródła: Mk6 90, Mk7 110, Mk8 135 Nm"),
      w("Focus, Mondeo, C-Max", 110, 140, "wg jednego źródła: Focus Mk2/Mk3 130, Mk4 135 Nm"),
      w("Kuga, Grand C-Max, Maverick", 130, 150, "wg jednego źródła: Kuga I 130, II 135 Nm"),
      w("Puma", 120, 135),
      w("Tourneo, Ranger", 120),
      w("B-Max, EcoSport", 135),
      w("Galaxy, S-Max", 150, 160),
      w("Mustang Mach-E", 150),
      w("Explorer EV", 120, 140),
    ],
  },
  {
    marka: "Honda",
    wpisy: [w("Jazz, Civic, Accord, CR-V, HR-V", 108, 120)],
  },
  {
    marka: "Hyundai",
    wpisy: [
      w("i10, i20, i30, Kona, Tucson", 100, 130, "źródła podają od 100 do 130 Nm"),
      w("Bayon", 100, 110),
      w("Ioniq 5, Ioniq 6", 110, 120),
      w("Santa Fe (2018+), H-1, Starex", 120, 140),
    ],
  },
  {
    marka: "Dodge / Infiniti",
    wpisy: [
      w("Dodge Caliber", 125, 135),
      w("Dodge Nitro", 130, 136),
      j("Infiniti Q50, Q60, Q70", 108),
      j("Infiniti Q30", 130),
    ],
  },
  {
    marka: "Jaguar",
    wpisy: [
      w("XE (2015+)", 125),
      w("XF (X250, X260)", 125, 165, "dwa źródła: 125 Nm; jedno podaje 165"),
      w("F-Pace, I-Pace", 133),
      w("E-Pace", 120, 133),
      w("S-Type, XJ (starsze)", 115, 135),
      w("X-Type", 80, 120, "źródła mocno się różnią — tylko z instrukcją"),
    ],
  },
  {
    marka: "Jeep",
    wpisy: [
      w("Renegade", 110),
      w("Compass, Patriot, Avenger", 100, 120),
      w("Wrangler", 130),
      w("Cherokee", 135),
      w("Grand Cherokee", 140),
    ],
  },
  {
    marka: "Kia",
    wpisy: [
      w("Picanto, Rio, Ceed, XCeed, Stonic, Sportage", 110, 130),
      w("Niro, e-Niro", 110, 120),
      w("Carnival, Sorento", 130),
      w("EV3, EV6, EV9", 120, 140),
    ],
  },
  {
    marka: "Lancia",
    wpisy: [
      w("Y, Ypsilon, Delta, Musa", 86, 120, "wartości dla stali i alu różnią się między źródłami"),
      w("Kappa, Thesis", 98),
      w("Phedra, Zeta", 100),
      w("Thema, Voyager", 150, 160),
      w("Ypsilon (2024+)", 100, 120),
    ],
  },
  {
    marka: "Land Rover",
    wpisy: [
      w("Discovery, Range Rover, Range Rover Sport", 140),
      w("Defender (do 2020)", 100, 120),
      w("Defender (2020+)", 140),
      w("Freelander", 115, 133),
      w("Evoque, Discovery Sport", 133, 140),
    ],
  },
  {
    marka: "Lexus",
    wpisy: [w("CT, IS, ES, GS, LBX", 103), w("UX, NX, RX (2016+)", 103, 140)],
  },
  {
    marka: "Mazda",
    wpisy: [
      w("Mazda2, Mazda5, CX-3, CX-30", 103),
      w("Mazda3, Mazda6, CX-5", 120, 140),
      w("MX-5", 98),
      w("MX-30", 103, 120),
      w("CX-60, CX-80", 128, 140),
    ],
  },
  {
    marka: "Mercedes-Benz",
    wpisy: [
      w("A, B, C, CLA, CLS, E, SL", 130, 150, "wersje AMG do 150 Nm wg jednego ze źródeł"),
      w("G", 130, 190, "starsza tabela podaje 190 Nm dla felg stalowych"),
      w("CLC, SLK", 110),
      w("GLA, GLB, GLC (2016+)", 130, 150),
      w("S, CL, R, M, GL, GLK", 150),
      w("EQA, EQB, EQC", 130),
      w("EQE, EQS", 150),
    ],
  },
  {
    marka: "MG",
    wpisy: [w("ZS, HS, MG3, MG4", 120)],
  },
  {
    marka: "Mini",
    wpisy: [w("Hatch, Clubman, Countryman, Aceman", 140, 140, "starsze generacje (do ok. 2006) w starych tabelach 90–110 Nm")],
  },
  {
    marka: "Mitsubishi",
    wpisy: [
      w("Colt, ASX, Outlander", 108),
      w("Pajero, Pajero Sport", 120),
      w("L200", 120, 140),
    ],
  },
  {
    marka: "Nissan",
    wpisy: [
      w("Micra, Juke, X-Trail, Murano", 108),
      w("Note", 105),
      w("Leaf", 112),
      w("Qashqai", 108, 113),
      w("Pathfinder", 113),
      w("Pick-up, Terrano II", 118, 147, "starsza tabela; wartość zależy od rocznika"),
      w("Patrol", 133),
      w("Ariya", 113, 120),
    ],
  },
  {
    marka: "Opel",
    wpisy: [
      w("Corsa A–E, Combo B/C", 110),
      w("Astra F / G / H", 110),
      w("Astra J / K (2009–2021)", 140),
      w("Astra L (2021+)", 110, 120),
      w("Zafira A / B", 110, 140),
      w("Mokka (2012–16)", 125, 140),
      w("Mokka X, Antara, GT, Ampera", 140),
      w("Insignia A (2008–17)", 150),
      w("Insignia B (2017+)", 125, 140),
      w("Insignia B GSi", 190),
      w("Crossland, Agila", 100),
      w("Grandland (X)", 100, 140, "jedno źródło: Grandland X 115 Nm"),
      w("Frontera (2024+)", 100, 120),
    ],
  },
  {
    marka: "Peugeot",
    wpisy: [
      w("206, 307, 407, 607", 90),
      w("208, 2008, 308, 3008, 5008", 90, 120),
      w("4008, 807, Expert", 110),
      w("508", 120),
    ],
  },
  {
    marka: "Porsche",
    wpisy: [w("911, Boxster, Cayman", 130), w("Cayenne, Macan, Panamera, Taycan", 160)],
  },
  {
    marka: "Renault",
    wpisy: [
      w("Clio, Twingo", 105, 130, "źródła podają od 105 do 130 Nm"),
      w("Megane, Captur, Kadjar, Kangoo", 105, 130),
      w("Fluence, Grand Scenic", 130),
      w("Austral, Espace, Rafale", 130),
      w("Arkana", 110, 130),
      w("Mégane / Scénic E-Tech", 110, 130),
    ],
  },
  {
    marka: "Seat",
    wpisy: [
      w("Ibiza, Leon, Arona, Ateca", 120),
      w("Mii", 110),
      w("Alhambra", 140, 170),
    ],
  },
  {
    marka: "Škoda",
    wpisy: [
      w("Fabia, Octavia, Superb, Karoq, Kamiq", 120),
      w("Citigo, Felicia", 110),
      w("Kodiaq", 140),
      w("Enyaq, Elroq", 120, 140),
    ],
  },
  {
    marka: "Smart / Polestar",
    wpisy: [w("Smart #1, #3", 140), w("Polestar 3, 4", 140)],
  },
  {
    marka: "Subaru",
    wpisy: [
      w("Impreza, Forester, Legacy", 78, 100),
      w("BRZ, WRX", 120),
    ],
  },
  {
    marka: "Suzuki",
    wpisy: [
      w("Swift, Ignis, SX4", 90, 95),
      w("Vitara, S-Cross", 90, 110),
      w("Jimny, Grand Vitara", 95, 110),
      w("Across", 103, 110),
    ],
  },
  {
    marka: "SsangYong / KGM",
    wpisy: [
      j("Tivoli", 117),
      w("Korando", 142),
      w("Rexton", 100, 142, "źródła się różnią; nowszy Rexton 142 Nm"),
      j("Musso (2018+)", 120, 140),
      j("Kyron", 130, 150, "stal 130, alu 150"),
      j("Rodius", 142),
    ],
  },
  {
    marka: "Starsze marki",
    wpisy: [
      j("Daewoo (wszystkie)", 90, 90, "dawna tabela"),
      j("Daihatsu (wszystkie)", 90, 120, "dawna tabela"),
      j("Isuzu Trooper", 118, 118, "dawna tabela"),
      j("Rover (większość), MG ZT", 110, 125, "dawna tabela"),
    ],
  },
  {
    marka: "Tesla",
    wpisy: [w("Model 3, Model Y", 175)],
  },
  {
    marka: "Toyota",
    wpisy: [
      w("Aygo, Yaris, Corolla", 103, 115, "źródła podają 103–115 Nm"),
      w("RAV4", 103, 120),
      w("Yaris Cross, Aygo X, C-HR, Corolla Cross, Prius (2023+)", 103, 110),
      w("Avensis (2009+)", 103, 135),
      w("Hilux, GT86", 120, 140),
      w("Land Cruiser", 110, 130),
      w("bZ4X", 140),
    ],
  },
  {
    marka: "Dostawcze i busy",
    wpisy: [
      w("Ford Transit (2014+, śruby M14)", 200, 200, "instrukcja Forda: 200 Nm, dokręcić ponownie po 160 km"),
      j("Ford Transit Mk5, 6 szpilek", 183),
      w("Ford Transit Custom (2012+)", 200),
      w("Ford Transit Connect", 129, 135),
      w("Mercedes Sprinter W901–W905", 180),
      w("Mercedes Sprinter W906 — felgi alu", 180),
      j("Mercedes Sprinter W906 — felgi stalowe", 210, 240, "wg forów z cytatem instrukcji; sprawdź w instrukcji"),
      w("Mercedes Vito, Viano, V", 130, 175, "źródła podają od 130 do 175 Nm; W447 prawdopodobnie wyżej"),
      w("VW Transporter T5 / T6 / T6.1", 150, 180, "instrukcja T5: 180 ±10 Nm"),
      w("VW Crafter I (2006–16) — felgi alu", 180),
      j("VW Crafter I (2006–16) — felgi stalowe", 240, 240, "wg forum z cytatem instrukcji"),
      w("VW Crafter (2017+), MAN TGE", 150, 180),
      w("Iveco Daily", 200, 375, "zależy od wersji: 35C–70C (szpilki M18) 290–375 Nm — tylko z instrukcją"),
      j("Fiat Ducato, Jumper, Boxer — śruby M14", 160),
      w("Fiat Ducato, Jumper, Boxer — śruby M16", 180),
      w("Renault Master, Opel Movano, Nissan NV400", 150, 175),
      w("Renault Trafic II/III, Opel Vivaro A/B, Nissan Primastar, NV300", 135, 160, "dwa źródła podają 160 Nm"),
      w("Opel Vivaro C (2019+)", 120, 125),
      w("Toyota Proace (2016+), Proace Electric", 125, 125, "dokument Toyota Europe"),
      w("Toyota Proace City (2019+)", 115, 115, "dokument Toyota Europe"),
      w("Opel Combo E (2018+), Partner / Berlingo (2019+)", 100, 115, "bliźniak Proace City — Toyota podaje 115 Nm"),
      w("Peugeot Partner, Citroën Berlingo (do 2018)", 85, 110),
      w("Opel Combo B / C", 85, 110),
      w("Nissan NV200", 108, 113),
    ],
  },
  {
    marka: "Volkswagen",
    wpisy: [
      w("Polo, Golf, Passat, Touran, T-Roc, T-Cross, Taigo", 120),
      w("Up", 110),
      w("Tiguan, Sharan (2010+)", 140, 150),
      w("Tiguan, Passat (2024+)", 140),
      w("Sharan (starszy), T4", 170),
      w("Touareg, Amarok", 150, 180),
      w("ID.3, ID.4, ID.5, ID.7", 120, 140),
    ],
  },
  {
    marka: "Volvo",
    wpisy: [
      w("C30, S40, V40, C70", 110),
      w("V50", 70, 110),
      w("S60, V60, V70, S80, XC60, XC70, XC90", 140),
      w("XC40, C40, EX30, EX40, EX90", 140),
    ],
  },
];

/** Alfabetycznie (wg polskiej kolejności), a karty zbiorcze na końcu. */
const NA_KONCU = ["Dostawcze i busy", "Starsze marki"];
export const MOMENTY_KOL: MarkaMomentow[] = [...MARKI_KOL].sort((a, b) => {
  const ak = NA_KONCU.indexOf(a.marka);
  const bk = NA_KONCU.indexOf(b.marka);
  if (ak !== -1 || bk !== -1) return (ak === -1 ? -1 : ak) - (bk === -1 ? -1 : bk);
  return a.marka.localeCompare(b.marka, "pl");
});

/** Marki bez danych w źródłach — na plakacie wypisane osobno, żeby nikt nie szukał na próżno. */
export const BEZ_DANYCH = [
  "BYD Seal U, Leapmotor, DR",
  "MG (poza MG3/MG4/ZS/HS), Genesis, Maserati, Alpine, Ram",
  "chińskie marki nowe na rynku: Xpeng, Nio, GWM / Ora, Omoda / Jaecoo, Lynk & Co, Maxus",
  "Mercedes Sprinter W907 / W910 (2018+), Ford Transit Courier",
  "modele starsze niż ok. 2010 — w źródłach tylko fragmentarycznie",
];

export const PROCEDURA = [
  "Śruby i nakrętki dokręcaj na krzyż: 4 śruby 1-3-4-2, 5 śrub 1-3-5-2-4.",
  "Dokręcaj dwustopniowo: najpierw do ok. 50–60% wartości, potem do pełnej.",
  "Gwinty muszą być czyste i suche — nie smaruj śrub ani nakrętek.",
  "Sprawdź moment po 50–100 km jazdy.",
  "Kluczem dynamometrycznym pracuj w środku jego zakresu (ok. 20–80%); tani albo nieskalibrowany klucz potrafi mylić się mocno. Po pracy odkręć nastawę do zera.",
  "Wstępnie dokręć wszystkie śruby na krzyż ok. 30–40 Nm, potem dokręć do wartości docelowej w tej samej kolejności.",
];

export const ZRODLA = [
  "Instrukcje i dokumenty producentów: Ford Transit 2015 (manualslib.com), Toyota Europe — momenty kół (toyotaspace.com)",
  "wheel-size.com, PureTyre (puretyre.co.uk), Pneuhaus Frank (pneufrank.ch), drehmoment-schluessel.de",
  "eTOMNAR (etomnar.pl, 05.2026), Betafer (betafer.it), Airsus (airsus.com.pl), Megatool (megatool.pl)",
  "OponyAlbert (oponyalbert.pl) i tabela Continental 2007 — tylko starsze modele",
  "fora użytkowników z cytatami instrukcji (Sprinter, Crafter, Ducato) — oznaczone jako jedno źródło",
];
