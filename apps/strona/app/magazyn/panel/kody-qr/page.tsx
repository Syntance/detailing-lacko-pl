import { KodyQrClient } from "@/components/magazyn/kody-qr-client";
import { getKodyQr } from "@/lib/kody-qr-dane";
import { ADRES_LINII } from "@/lib/linie";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kody QR" };

export default async function KodyQrPage() {
  const dane = await getKodyQr();
  return <KodyQrClient initial={dane} adresBazowy={ADRES_LINII.detailing} />;
}
