/**
 * Formaty wejściowe akceptowane w uploadzie CMS. Każdy z nich sharp
 * (libvips) potrafi zdekodować, a `prepareCmsUploadFile` i tak konwertuje
 * wynik do WebP — więc lista wejściowa może być szeroka bez kosztu po stronie
 * serwowania. HEIC/HEIF to domyślny format zdjęć z iPhone'a.
 *
 * SVG celowo POZA listą: jest wektorem z możliwością osadzenia skryptu
 * (XSS przy serwowaniu), a `prepareCmsUploadFile` odrzuca go osobno.
 */
const CMS_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/pjpeg",
	"image/webp",
	"image/gif",
	"image/avif",
	"image/heic",
	"image/heif",
	"image/heic-sequence",
	"image/heif-sequence",
	"image/tiff",
]);

const CMS_EXT_TO_MIME: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	jfif: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	avif: "image/avif",
	heic: "image/heic",
	heif: "image/heif",
	tif: "image/tiff",
	tiff: "image/tiff",
};

/** Etykieta do komunikatów i atrybutu `accept` w formularzach. */
export const CMS_ALLOWED_FORMATS_LABEL = "JPG, PNG, WEBP, GIF, AVIF, HEIC, TIFF";

/**
 * Wartość dla `<input accept>`. Zawiera też rozszerzenia, bo przeglądarki
 * (zwłaszcza na Windows) często raportują HEIC/TIFF jako pusty `type`.
 */
export const CMS_ACCEPT_ATTRIBUTE = [
	...CMS_IMAGE_TYPES,
	...Object.keys(CMS_EXT_TO_MIME).map((ext) => `.${ext}`),
].join(",");

export function inferCmsMimeType(file: File): string | null {
	const type = file.type.toLowerCase();
	if (CMS_IMAGE_TYPES.has(type)) return type;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	const fromExt = CMS_EXT_TO_MIME[ext];
	return fromExt && CMS_IMAGE_TYPES.has(fromExt) ? fromExt : null;
}

export function inferCmsMimeFromMeta(filename: string, contentType: string): string | null {
	const type = contentType.toLowerCase();
	if (CMS_IMAGE_TYPES.has(type)) return type;
	const ext = filename.split(".").pop()?.toLowerCase() ?? "";
	const fromExt = CMS_EXT_TO_MIME[ext];
	return fromExt && CMS_IMAGE_TYPES.has(fromExt) ? fromExt : null;
}
