import "server-only";

import { readBlob, readBlobStrict, writeBlob } from "./blobs";
import {
  cennikDataSchema,
  DEFAULT_CENNIK,
  type CennikData,
} from "./cennik";
import { DEFAULT_CENNIK_WULKANIZACJA } from "./cennik-wulkanizacja";
import {
  galeriaDataSchema,
  DEFAULT_GALERIA,
  type GaleriaData,
} from "./galeria";
import { seoDataSchema, DEFAULT_SEO, type SeoData } from "./seo";
import {
  seoStronySchema,
  DEFAULT_SEO_WULKANIZACJA,
  type SeoStrony,
} from "./seo-wulkanizacja";
import { kontaktSchema, DEFAULT_KONTAKT, type KontaktData } from "./site";
import { faqDataSchema, DEFAULT_FAQ, type FaqData } from "./faq";
import { DEFAULT_FAQ_WULKANIZACJA } from "./faq-wulkanizacja";
import {
  edycjaDrukuSchema,
  kluczBlobuDruku,
  PUSTA_EDYCJA,
  type EdycjaDruku,
  type PlakatEdytowalny,
} from "./druk-edycja";
import {
  metamorfozyDataSchema,
  DEFAULT_METAMORFOZY,
  type MetamorfozyData,
} from "./metamorfozy";

export const BLOB_KEYS = {
  cennik: "cennik",
  galeria: "galeria",
  kontakt: "kontakt",
  metamorfozy: "metamorfozy",
  seo: "seo",
  faq: "faq",
  // Linia Wulkanizacja: ten sam model danych, osobne bloby — cennik, FAQ i SEO
  // strony różnią się w całości, a kontakt i godziny pracy są wspólne (jeden
  // warsztat). Klucze z sufiksem, żeby stare bloby detailingu zostały nietknięte.
  cennikWulkanizacja: "cennik-wulkanizacja",
  faqWulkanizacja: "faq-wulkanizacja",
  seoWulkanizacja: "seo-wulkanizacja",
} as const;

export async function getCennik(): Promise<CennikData> {
  return readBlob(BLOB_KEYS.cennik, cennikDataSchema, DEFAULT_CENNIK);
}

/** Cennik do wydruku — bez cichego fallbacku (patrz `readBlobStrict`). */
export async function getCennikDoDruku(): Promise<CennikData> {
  return readBlobStrict(BLOB_KEYS.cennik, cennikDataSchema, DEFAULT_CENNIK);
}

export async function getCennikWulkanizacjaDoDruku(): Promise<CennikData> {
  return readBlobStrict(
    BLOB_KEYS.cennikWulkanizacja,
    cennikDataSchema,
    DEFAULT_CENNIK_WULKANIZACJA,
  );
}

export async function saveCennik(data: CennikData): Promise<void> {
  await writeBlob(BLOB_KEYS.cennik, data);
}

export async function getCennikWulkanizacja(): Promise<CennikData> {
  return readBlob(
    BLOB_KEYS.cennikWulkanizacja,
    cennikDataSchema,
    DEFAULT_CENNIK_WULKANIZACJA,
  );
}

export async function saveCennikWulkanizacja(data: CennikData): Promise<void> {
  await writeBlob(BLOB_KEYS.cennikWulkanizacja, data);
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

export async function getSeoWulkanizacja(): Promise<SeoStrony> {
  return readBlob(
    BLOB_KEYS.seoWulkanizacja,
    seoStronySchema,
    DEFAULT_SEO_WULKANIZACJA,
  );
}

export async function saveSeoWulkanizacja(data: SeoStrony): Promise<void> {
  await writeBlob(BLOB_KEYS.seoWulkanizacja, data);
}

export async function getMetamorfozy(): Promise<MetamorfozyData> {
  return readBlob(
    BLOB_KEYS.metamorfozy,
    metamorfozyDataSchema,
    DEFAULT_METAMORFOZY,
  );
}

export async function saveMetamorfozy(data: MetamorfozyData): Promise<void> {
  await writeBlob(BLOB_KEYS.metamorfozy, data);
}

export async function getFaq(): Promise<FaqData> {
  return readBlob(BLOB_KEYS.faq, faqDataSchema, DEFAULT_FAQ);
}

export async function saveFaq(data: FaqData): Promise<void> {
  await writeBlob(BLOB_KEYS.faq, data);
}

export async function getFaqWulkanizacja(): Promise<FaqData> {
  return readBlob(
    BLOB_KEYS.faqWulkanizacja,
    faqDataSchema,
    DEFAULT_FAQ_WULKANIZACJA,
  );
}

export async function saveFaqWulkanizacja(data: FaqData): Promise<void> {
  await writeBlob(BLOB_KEYS.faqWulkanizacja, data);
}

export async function getEdycjaDruku(id: PlakatEdytowalny): Promise<EdycjaDruku> {
  return readBlob(kluczBlobuDruku(id), edycjaDrukuSchema, PUSTA_EDYCJA);
}

export async function saveEdycjaDruku(id: PlakatEdytowalny, data: EdycjaDruku): Promise<void> {
  await writeBlob(kluczBlobuDruku(id), data);
}
