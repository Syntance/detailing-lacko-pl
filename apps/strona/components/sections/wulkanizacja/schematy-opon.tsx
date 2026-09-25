import type { ReactNode } from "react";

/**
 * Schematy do sekcji „Co nie kwalifikuje się do naprawy" — płaskie rysunki
 * w języku naklejek (gruba kreska `--ink`, akcent jako „nie"). Tekst w SVG
 * skaluje się z viewBoxem, więc napisy są krótkie, a pełne wyjaśnienie
 * stoi obok w HTML.
 */

const INK = "var(--ink)";
const TLO = "var(--background)";
const AKCENT = "var(--akcent)";

const napis = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  letterSpacing: "0.12em",
} as const;

/** Kolory stref — wspólne dla schematu i legendy obok, żeby numer i kolor się zgadzały. */
export const KOLOR_STREFY = {
  bieznik: TLO,
  bark: "var(--zolty)",
  bok: "var(--czerwony-jasny)",
} as const;

function Numer({ x, y, n, fill }: { x: number; y: number; n: number; fill: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="17" fill={fill} stroke={INK} strokeWidth="4" />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill={INK}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {n}
      </text>
    </g>
  );
}

/** Przekrój opony z trzema strefami naprawy jak w tabeli producenta łatek. */
export function SchematStrefNaprawy() {
  const bok = "M96,262 C82,222 80,172 82,132";
  const barkL = "M82,132 A72,72 0 0 1 154,60 L196,60";
  const srodek = "M196,60 L324,60";
  const barkP = "M324,60 L366,60 A72,72 0 0 1 438,132";
  const bokP = "M438,132 C440,172 438,222 424,262";
  const calosc =
    "M96,262 C82,222 80,172 82,132 A72,72 0 0 1 154,60 L366,60 A72,72 0 0 1 438,132 C440,172 438,222 424,262";

  return (
    <svg
      viewBox="0 0 520 320"
      role="img"
      aria-label="Przekrój opony z trzema strefami naprawy: 1 — środek bieżnika, 2 — bark, 3 — bok. Każda strefa ma własny limit rozmiaru uszkodzenia."
      className="h-auto w-full"
    >
      {[164, 200, 236, 272, 308, 344].map((x) => (
        <rect key={x} x={x} y="30" width="22" height="14" rx="3" fill={INK} />
      ))}

      {/* Guma: czarny obrys, w środku kolor strefy. */}
      <path
        d={calosc}
        fill="none"
        stroke={INK}
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[bok, bokP].map((d) => (
        <path key={d} d={d} fill="none" stroke={KOLOR_STREFY.bok} strokeWidth="28" />
      ))}
      {[barkL, barkP].map((d) => (
        <path key={d} d={d} fill="none" stroke={KOLOR_STREFY.bark} strokeWidth="28" />
      ))}
      <path d={srodek} fill="none" stroke={KOLOR_STREFY.bieznik} strokeWidth="28" />

      {/* Granice stref. */}
      <line x1="196" y1="40" x2="196" y2="80" stroke={INK} strokeWidth="4" />
      <line x1="324" y1="40" x2="324" y2="80" stroke={INK} strokeWidth="4" />
      <line x1="62" y1="132" x2="102" y2="132" stroke={INK} strokeWidth="4" />
      <line x1="418" y1="132" x2="458" y2="132" stroke={INK} strokeWidth="4" />

      {/* Felga między stopkami opony. */}
      <path
        d="M96,262 L96,292 L424,292 L424,262"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeDasharray="10 8"
        strokeLinecap="round"
      />
      <text x="260" y="284" textAnchor="middle" fontSize="15" fill={INK} style={napis}>
        FELGA
      </text>

      <Numer x={260} y={60} n={1} fill={KOLOR_STREFY.bieznik} />
      <Numer x={103} y={81} n={2} fill={KOLOR_STREFY.bark} />
      <Numer x={82} y={205} n={3} fill={KOLOR_STREFY.bok} />
      <Numer x={417} y={81} n={2} fill={KOLOR_STREFY.bark} />
      <Numer x={438} y={205} n={3} fill={KOLOR_STREFY.bok} />
    </svg>
  );
}

function Bieznik({ y = 24 }: { y?: number }) {
  return (
    <>
      <rect x="20" y={y} width="200" height="60" rx="8" fill={TLO} stroke={INK} strokeWidth="3" />
      {[60, 100, 140, 180].map((x) => (
        <line key={x} x1={x} y1={y} x2={x} y2={y + 60} stroke={INK} strokeWidth="3" strokeDasharray="12 6" />
      ))}
    </>
  );
}

function Plansza({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 120" aria-hidden focusable="false" className="h-auto w-full">
      {children}
    </svg>
  );
}

export function SchematDuzaDziura() {
  return (
    <Plansza>
      <Bieznik />
      <circle cx="120" cy="54" r="16" fill={AKCENT} stroke={INK} strokeWidth="3" />
      <circle cx="120" cy="54" r="7" fill={INK} />
      <line x1="104" y1="54" x2="104" y2="104" stroke={INK} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="136" y1="54" x2="136" y2="104" stroke={INK} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="104" y1="100" x2="136" y2="100" stroke={INK} strokeWidth="3" />
      <text x="144" y="105" fontSize="13" fill={INK} style={napis}>
        &gt; LIMIT
      </text>
    </Plansza>
  );
}

export function SchematDwaPrzebicia() {
  return (
    <Plansza>
      <Bieznik />
      {[106, 134].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="54" r="8" fill={AKCENT} stroke={INK} strokeWidth="3" />
          <circle cx={cx} cy="54" r="3" fill={INK} />
        </g>
      ))}
      <path d="M96,100 L96,94 L144,94 L144,100" fill="none" stroke={INK} strokeWidth="3" />
      <text x="152" y="105" fontSize="13" fill={INK} style={napis}>
        ZA BLISKO
      </text>
    </Plansza>
  );
}

export function SchematBabel() {
  return (
    <Plansza>
      <circle cx="120" cy="140" r="100" fill={INK} />
      <circle cx="184" cy="64" r="15" fill={AKCENT} stroke={INK} strokeWidth="3" />
      <circle cx="120" cy="140" r="58" fill={TLO} stroke={INK} strokeWidth="3" />
      <circle cx="120" cy="140" r="16" fill={INK} />
      {[-40, 0, 40].map((kat) => (
        <line
          key={kat}
          x1="120"
          y1="140"
          x2={120 + 58 * Math.sin((kat * Math.PI) / 180)}
          y2={140 - 58 * Math.cos((kat * Math.PI) / 180)}
          stroke={INK}
          strokeWidth="6"
        />
      ))}
      <text x="206" y="40" textAnchor="middle" fontSize="13" fill={INK} style={napis}>
        BĄBEL
      </text>
      <line x1="202" y1="46" x2="194" y2="54" stroke={INK} strokeWidth="2.5" />
    </Plansza>
  );
}

export function SchematKapec() {
  return (
    <Plansza>
      <line x1="16" y1="106" x2="224" y2="106" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M66,106 C34,106 30,34 120,24 C210,34 206,106 174,106 Z"
        fill={INK}
      />
      <circle cx="120" cy="72" r="26" fill={TLO} stroke={INK} strokeWidth="3" />
      <circle cx="120" cy="72" r="7" fill={INK} />
      <rect x="170" y="14" width="56" height="24" rx="12" fill={AKCENT} stroke={INK} strokeWidth="3" />
      <text x="198" y="31" textAnchor="middle" fontSize="12" fill={INK} style={napis}>
        0 BAR
      </text>
    </Plansza>
  );
}

export function SchematStaraGuma() {
  return (
    <Plansza>
      <rect x="20" y="24" width="200" height="72" rx="10" fill={TLO} stroke={INK} strokeWidth="3" />
      {[
        "M34,40 L44,48 L40,56 L52,66",
        "M60,82 L70,74 L66,66 L80,58",
        "M92,36 L98,46 L90,54",
        "M200,82 L190,74 L196,64",
      ].map((d) => (
        <path key={d} d={d} fill="none" stroke={AKCENT} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <rect x="104" y="44" width="88" height="32" rx="16" fill="var(--piasek)" stroke={INK} strokeWidth="3" />
      <text x="148" y="65" textAnchor="middle" fontSize="13" fill={INK} style={napis}>
        DOT 0314
      </text>
    </Plansza>
  );
}

export function SchematLysyBieznik() {
  const klocki = [24, 66, 108, 150, 192];
  return (
    <Plansza>
      {klocki.map((x) => (
        <rect
          key={`nowy-${x}`}
          x={x}
          y="28"
          width="30"
          height="44"
          rx="3"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
      ))}
      <rect x="20" y="72" width="204" height="30" rx="4" fill={INK} />
      {klocki.map((x) => (
        <rect key={x} x={x} y="64" width="30" height="10" rx="2" fill={INK} />
      ))}
      <line x1="75" y1="64" x2="75" y2="72" stroke={AKCENT} strokeWidth="3" />
      <text x="96" y="20" fontSize="12" fill="var(--muted-foreground)" style={napis}>
        NOWA
      </text>
      <text x="120" y="116" textAnchor="middle" fontSize="13" fill={INK} style={napis}>
        &lt; 1,6 MM
      </text>
    </Plansza>
  );
}
