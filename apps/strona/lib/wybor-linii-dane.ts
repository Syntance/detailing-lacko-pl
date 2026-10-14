import "server-only";

import { readBlob, writeBlob } from "./blobs";
import { DEFAULT_WYBOR_LINII, wyborLiniiSchema, type WyborLiniiData } from "./wybor-linii";

const KLUCZ = "wybor-linii";

export async function getWyborLinii(): Promise<WyborLiniiData> {
  return readBlob(KLUCZ, wyborLiniiSchema, DEFAULT_WYBOR_LINII);
}

export async function saveWyborLinii(data: WyborLiniiData): Promise<void> {
  await writeBlob(KLUCZ, data);
}
