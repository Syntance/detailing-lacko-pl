/**
 * Ilustracja koła do karty hero linii Wulkanizacja — zamiast zdjęcia, dopóki
 * panel (Magazyn → Wulkanizacja → CMS) nie dostanie prawdziwego kadru.
 * Rysowana w języku makiety: twarda kreska, kolor z tokenów (na tej stronie
 * `--akcent` to czerwień), kreski ruchu i dwa „psss" z zaworka — kreskówkowo,
 * jak lanca z pianą w hero detailingu. Inline SVG, bo bierze kolory z CSS.
 */
export function IlustracjaKola() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="block h-full w-full"
      role="img"
      aria-label="Koło samochodowe z oponą — ilustracja"
    >
      {/* kreski ruchu */}
      <g
        stroke="var(--ink)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      >
        <line x1="24" y1="118" x2="96" y2="118" />
        <line x1="44" y1="152" x2="112" y2="152" />
        <line x1="30" y1="186" x2="90" y2="186" />
      </g>

      {/* opona */}
      <circle cx="238" cy="150" r="128" fill="var(--ink)" />
      <circle
        cx="238"
        cy="150"
        r="108"
        fill="none"
        stroke="var(--background)"
        strokeWidth="11"
        strokeDasharray="14 19.7"
        strokeDashoffset="6"
      />
      <path
        d="M126 108 A122 122 0 0 1 178 44"
        fill="none"
        stroke="var(--background)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* felga */}
      <circle
        cx="238"
        cy="150"
        r="84"
        fill="var(--akcent)"
        stroke="var(--ink)"
        strokeWidth="8"
      />
      <g strokeLinecap="round">
        <g stroke="var(--ink)" strokeWidth="28">
          <line x1="238" y1="132" x2="238" y2="78" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(72 238 150)" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(144 238 150)" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(216 238 150)" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(288 238 150)" />
        </g>
        <g stroke="var(--background)" strokeWidth="13">
          <line x1="238" y1="132" x2="238" y2="78" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(72 238 150)" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(144 238 150)" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(216 238 150)" />
          <line x1="238" y1="132" x2="238" y2="78" transform="rotate(288 238 150)" />
        </g>
      </g>
      <circle
        cx="238"
        cy="150"
        r="24"
        fill="var(--background)"
        stroke="var(--ink)"
        strokeWidth="8"
      />
      <circle cx="238" cy="150" r="7" fill="var(--ink)" />

      {/* zaworek + „psss" */}
      <g transform="rotate(-38 238 150)">
        <rect
          x="232"
          y="6"
          width="12"
          height="26"
          rx="4"
          fill="var(--background)"
          stroke="var(--ink)"
          strokeWidth="5"
        />
      </g>
      <g
        fill="var(--background)"
        stroke="var(--ink)"
        strokeWidth="5"
      >
        <circle cx="332" cy="34" r="11" />
        <circle cx="356" cy="18" r="7" />
        <circle cx="372" cy="46" r="5" />
      </g>
    </svg>
  );
}
