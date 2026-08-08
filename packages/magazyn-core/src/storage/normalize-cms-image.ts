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
	const { default: sharp } = await import("sharp");
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

/** Przygotowuje plik z panelu CMS do uploadu (zawsze WebP). */
export async function prepareCmsUploadFile(file: File): Promise<File> {
	if (isSvgFile(file)) {
		throw new Error("SVG nie jest obsługiwany — użyj JPG, PNG lub WebP.");
	}

	const optimized = await normalizeCmsImageToWebp(Buffer.from(await file.arrayBuffer()));
	return new File([new Uint8Array(optimized)], cmsUploadFileName(file.name), {
		type: "image/webp",
	});
}
