/**
 * Mapa Google z pinezką w karcie hero — osadzona zawsze, niezależnie od zgody
 * na cookies (decyzja właściciela; iframe Google ustawia własne ciasteczka).
 */
export function HeroMapa({ adres }: { adres: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-piasek">
      <iframe
        title={`Mapa: ${adres}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(adres)}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
