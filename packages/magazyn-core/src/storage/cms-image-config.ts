/** Max dłuższy bok obrazu CMS (upload + sync/build). */
export const CMS_IMAGE_MAX_LONG_EDGE = 1920;

/** WebP q92 — praktycznie bez widocznej straty, wyraźnie lżejsze niż JPEG z aparatu. */
export const CMS_IMAGE_WEBP_QUALITY = 92;

/** Zgodne z limitem Medusa admin uploads (~20 MB). */
export const MAX_CMS_UPLOAD_BYTES = 20 * 1024 * 1024;

export const MAX_CMS_UPLOAD_MB = Math.floor(MAX_CMS_UPLOAD_BYTES / (1024 * 1024));

/** Vercel odrzuca body > ~4.5 MB — większe pliki idą presigned PUT prosto do R2. */
export const VERCEL_SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;

export const VERCEL_SAFE_UPLOAD_MB = Math.floor(VERCEL_SAFE_UPLOAD_BYTES / (1024 * 1024));
