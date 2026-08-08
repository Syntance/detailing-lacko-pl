import type sharpType from "sharp";
import { CMS_IMAGE_MAX_LONG_EDGE, CMS_IMAGE_WEBP_QUALITY } from "./cms-image-config";

/**
 * Konwersja CMS → WebP (EXIF rotate, max bok, q92).
 *
 * sharp ładowany dynamicznie, NIE statycznym importem u góry pliku: ten moduł
 * wisi w barrelu `@moduly/magazyn-core`, który ciągnie `initModuly()` z
 * instrumentation hooka, czyli przy każdym starcie funkcji serwerowej. Statyczny
 * import wciągał ~30 MB natywnej biblioteki na każdy cold start, a gdy jej
 * binarka nie działała na runtime Vercela (ERR_DLOPEN_FAILED na libvips),
 * wywracał render KAŻDEJ strony SSR — panel /magazyn oddawał 500. Leniwy import
 * ogranicza skutek awarii sharpa do samego uploadu obrazków.
 */
export async function normalizeCmsImageToWebp(input: Buffer): Promise<Buffer> {
	let sharp: typeof sharpType;
	try {
		({ default: sharp } = await import("sharp"));
	} catch {
		// Natywne libvips nie ładuje się na tym runtime (typowo Vercel: `.so`
		// nie trafia do bundla funkcji). Czytelny komunikat zamiast 500 —
		// przeglądarka konwertuje sama wszystko poza HEIC/TIFF, więc realnie
		// dotyczy to tylko tych dwóch formatów.
		throw new Error(
			"Ten format wymaga konwersji na serwerze, która jest niedostępna. Zapisz zdjęcie jako JPG, PNG lub WebP i wgraj ponownie.",
		);
	}

	return sharp(input)
		.rotate()
		.resize(CMS_IMAGE_MAX_LONG_EDGE, CMS_IMAGE_MAX_LONG_EDGE, {
			fit: "inside",
			withoutEnlargement: true,
		})
		.webp({
			quality: CMS_IMAGE_WEBP_QUALITY,
			effort: 4,
			smartSubsample: true,
		})
		.toBuffer();
}

export function cmsUploadFileName(originalName: string): string {
	const stem =
		originalName
			.replace(/\.[^.]+$/, "")
			.replace(/[^\w.-]+/g, "-")
			.replace(/^-+|-+$/g, "") || "cms-image";
	return `${stem}.webp`;
}

function isSvgFile(file: File): boolean {
	return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

function isWebpFile(file: File): boolean {
	return (
		file.type.toLowerCase() === "image/webp" ||
		file.name.toLowerCase().endsWith(".webp")
	);
}

/** Przygotowuje plik z panelu CMS do uploadu (zawsze WebP). */
export async function prepareCmsUploadFile(file: File): Promise<File> {
	if (isSvgFile(file)) {
		throw new Error("SVG nie jest obsługiwany — użyj JPG, PNG lub WebP.");
	}

	// Przeglądarka konwertuje do WebP jeszcze przed wysyłką (patrz
	// client/cms-image-upload.ts), więc typowy upload w ogóle nie budzi sharpa.
	// Zostaje on wyłącznie dla formatów, których canvas nie dekoduje (HEIC poza
	// Safari, TIFF).
	if (isWebpFile(file)) return file;

	const optimized = await normalizeCmsImageToWebp(Buffer.from(await file.arrayBuffer()));
	return new File([new Uint8Array(optimized)], cmsUploadFileName(file.name), {
		type: "image/webp",
	});
}
