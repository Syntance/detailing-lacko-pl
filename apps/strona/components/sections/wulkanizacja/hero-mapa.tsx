/**
 * Wizytówka Google „Wulkanizacja Łącko" (nie sam adres): w osadzonej mapie
 * Google pokazuje wtedy kartę firmy, a jej „Otwórz w Mapach" prowadzi do
 * wizytówki z opiniami. CID = drugi człon identyfikatora miejsca z linku
 * udostępniania (0xb14638fe9f1ee89) zapisany dziesiętnie.
 */
export const WIZYTOWKA_WULKANIZACJA = {
  cid: "798372503707840137",
  url: "https://maps.app.goo.gl/yJEDZG3DXoY2r9Wd8",
} as const;

/**
 * Mapa Google z pinezką wizytówki w karcie hero — osadzona zawsze, niezależnie
 * od zgody na cookies (decyzja właściciela; iframe Google ustawia własne ciasteczka).
 */
export function HeroMapa({ nazwa }: { nazwa: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-piasek">
      <iframe
        title={`Mapa: ${nazwa}`}
        src={`https://www.google.com/maps?cid=${WIZYTOWKA_WULKANIZACJA.cid}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
