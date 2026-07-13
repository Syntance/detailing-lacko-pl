import { RezerwacjeClient } from "@/components/magazyn/rezerwacje-client";
import { getDostepnosc, listRezerwacje } from "@/lib/rezerwacje-store";

export const dynamic = "force-dynamic";

export default async function RezerwacjePanelPage() {
  const [reservations, config] = await Promise.all([
    listRezerwacje(),
    getDostepnosc(),
  ]);
  return (
    <RezerwacjeClient initialReservations={reservations} initialConfig={config} />
  );
}
