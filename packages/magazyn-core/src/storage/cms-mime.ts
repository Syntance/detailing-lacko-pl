const CMS_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/pjpeg",
	"image/webp",
	"image/gif",
	"image/avif",
]);

const CMS_EXT_TO_MIME: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	avif: "image/avif",
};

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
