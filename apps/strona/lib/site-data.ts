import "server-only";

import { readBlob, writeBlob } from "./blobs";
import {
  cennikDataSchema,
  DEFAULT_CENNIK,
  type CennikData,
} from "./cennik";
import {
  galeriaDataSchema,
  DEFAULT_GALERIA,
  type GaleriaData,
} from "./galeria";
import { seoDataSchema, DEFAULT_SEO, type SeoData } from "./seo";
import { kontaktSchema, DEFAULT_KONTAKT, type KontaktData } from "./site";

export const BLOB_KEYS = {
  cennik: "cennik",
  galeria: "galeria",
  kontakt: "kontakt",
  seo: "seo",
} as const;

export async function getCennik(): Promise<CennikData> {
  return readBlob(BLOB_KEYS.cennik, cennikDataSchema, DEFAULT_CENNIK);
}

export async function saveCennik(data: CennikData): Promise<void> {
  await writeBlob(BLOB_KEYS.cennik, data);
}

export async function getGaleria(): Promise<GaleriaData> {
  return readBlob(BLOB_KEYS.galeria, galeriaDataSchema, DEFAULT_GALERIA);
}

export async function saveGaleria(data: GaleriaData): Promise<void> {
  await writeBlob(BLOB_KEYS.galeria, data);
}

export async function getKontakt(): Promise<KontaktData> {
  return readBlob(BLOB_KEYS.kontakt, kontaktSchema, DEFAULT_KONTAKT);
}

export async function saveKontakt(data: KontaktData): Promise<void> {
  await writeBlob(BLOB_KEYS.kontakt, data);
}

export async function getSeo(): Promise<SeoData> {
  return readBlob(BLOB_KEYS.seo, seoDataSchema, DEFAULT_SEO);
}

export async function saveSeo(data: SeoData): Promise<void> {
  await writeBlob(BLOB_KEYS.seo, data);
}
