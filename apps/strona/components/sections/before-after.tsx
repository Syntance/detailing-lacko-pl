"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Suwak porównawczy przed/po — jedyny „efekt" na stronie (plan www v2, UI).
 * Bez zależności: warstwa „przed" przycinana clip-path, sterowanie
 * niewidocznym input[type=range] (drag + klawiatura + czytniki ekranu).
 */
export function BeforeAfter({
  beforeUrl,
  afterUrl,
  alt,
  sizes,
  onFirstInteract,
}: {
  beforeUrl: string;
  afterUrl: string;
  alt: string;
  sizes: string;
  onFirstInteract?: () => void;
}) {
  const [position, setPosition] = useState(50);
  const interacted = useRef(false);

  const handleChange = (value: number) => {
    setPosition(value);
    if (!interacted.current) {
      interacted.current = true;
      onFirstInteract?.();
    }
  };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-card select-none">
      <Image
        src={afterUrl}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        draggable={false}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* Linia podziału z uchwytem. */}
      <div
        aria-hidden
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-md">
          ⇄
        </span>
      </div>

      <span
        aria-hidden
        className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
      >
        przed
      </span>
      <span
        aria-hidden
        className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
      >
        po
      </span>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => handleChange(Number(e.target.value))}
        aria-label={`Porównaj przed i po: ${alt}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
