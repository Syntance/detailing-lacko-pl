import "server-only";

import { readBlob, writeBlob } from "./blobs";
import { DEFAULT_KODY_QR, kodyQrDataSchema, type KodyQrData } from "./kody-qr";

const KLUCZ = "kody-qr";

export async function getKodyQr(): Promise<KodyQrData> {
  return readBlob(KLUCZ, kodyQrDataSchema, DEFAULT_KODY_QR);
}

export async function saveKodyQr(data: KodyQrData): Promise<void> {
  await writeBlob(KLUCZ, data);
}
