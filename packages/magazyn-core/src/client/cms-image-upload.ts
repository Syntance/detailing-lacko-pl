import {
	getCmsUploadApiPath,
	getCmsUploadPresignApiPath,
} from "../configure";
import {
	MAX_CMS_UPLOAD_BYTES,
	MAX_CMS_UPLOAD_MB,
	VERCEL_SAFE_UPLOAD_BYTES,
	VERCEL_SAFE_UPLOAD_MB,
} from "../storage/cms-image-config";
import {
	canCompressCmsImage,
	compressCmsImageForUpload,
	prepareCmsImageForUpload,
} from "../storage/compress-cms-image";
import { inferCmsMimeType } from "../storage/cms-mime";

/**
 * Typ MIME do presign/PUT. Zgadujemy z rozszerzenia, gdy przeglądarka nie
 * poda `type` — częste przy HEIC z iPhone'a i TIFF na Windows.
 */
function resolveUploadContentType(file: File): string {
	return inferCmsMimeType(file) ?? file.type ?? "application/octet-stream";
}

async function readJsonUploadResponse(
	res: Response,
): Promise<{ ok: boolean; urls: string[]; error: string | null }> {
	const contentType = res.headers.get("content-type") ?? "";
	const text = await res.text();

	if (contentType.includes("application/json") && text) {
		try {
			const payload = JSON.parse(text) as { urls?: string[]; error?: string | null };
			const error = payload.error ?? null;
			return {
				ok: res.ok && !error,
				urls: payload.urls ?? [],
				error: error ?? (res.ok ? null : "Upload nie powiódł się. Spróbuj ponownie."),
			};
		} catch {
			/* fall through */
		}
	}

	if (res.status === 413) {
		return {
			ok: false,
			urls: [],
			error: `Serwer Vercel odrzucił plik (limit ~${VERCEL_SAFE_UPLOAD_MB} MB przez API). Większe pliki wysyłamy bezpośrednio do R2.`,
		};
	}
	if (res.status === 401) {
		return { ok: false, urls: [], error: "Sesja wygasła — zaloguj się ponownie." };
	}
	if (res.status >= 502) {
		return {
			ok: false,
			urls: [],
			error: "Serwer chwilowo niedostępny. Odśwież stronę i spróbuj ponownie.",
		};
	}

	return {
		ok: false,
		urls: [],
		error: `Upload nie powiódł się — nieoczekiwana odpowiedź serwera. Spróbuj JPG/WebP do ${MAX_CMS_UPLOAD_MB} MB.`,
	};
}

function isNetworkFetchError(error: unknown): boolean {
	return error instanceof TypeError && error.message === "Failed to fetch";
}

function wrapUploadFetchError(error: unknown, stage: "api" | "presign" | "r2"): Error {
	if (isNetworkFetchError(error)) {
		if (stage === "r2") {
			return new Error(
				"Przeglądarka nie mogła wysłać pliku do magazynu R2. W Cloudflare R2 włącz CORS (metoda PUT) dla domeny sklepu i panelu.",
			);
		}
		if (stage === "presign") {
			return new Error(
				"Nie udało się połączyć z serwerem uploadu. Odśwież stronę i spróbuj ponownie.",
			);
		}
		return new Error(
			"Połączenie przerwane podczas wysyłania pliku. Spróbuj mniejszy plik (JPG/WebP) lub ponów upload za chwilę.",
		);
	}
	if (error instanceof Error) return error;
	return new Error("Upload nie powiódł się. Spróbuj ponownie.");
}

function isR2PresignUnavailableMessage(message: string | null | undefined): boolean {
	if (!message) return false;
	return /wymagają R2|R2_PRESIGN|magazyn plików niedostępny|S3_\*/i.test(message);
}

async function readPresignResponse(
	res: Response,
): Promise<{ ok: boolean; uploadUrl?: string; publicUrl?: string; error: string | null }> {
	const contentType = res.headers.get("content-type") ?? "";
	const text = await res.text();

	if (contentType.includes("application/json") && text) {
		try {
			const payload = JSON.parse(text) as {
				uploadUrl?: string;
				publicUrl?: string;
				error?: string | null;
			};
			const error = payload.error ?? null;
			return {
				ok: res.ok && !error && Boolean(payload.uploadUrl && payload.publicUrl),
				uploadUrl: payload.uploadUrl,
				publicUrl: payload.publicUrl,
				error: error ?? (res.ok ? null : "Nie udało się przygotować uploadu."),
			};
		} catch {
			/* fall through */
		}
	}

	return { ok: false, error: "Nie udało się przygotować uploadu do magazynu plików." };
}

async function uploadViaPresigned(file: File): Promise<string> {
	const contentType = resolveUploadContentType(file);

	let presignRes: Response;
	try {
		presignRes = await fetch(getCmsUploadPresignApiPath(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "same-origin",
			body: JSON.stringify({
				filename: file.name,
				contentType,
				size: file.size,
			}),
		});
	} catch (error) {
		throw wrapUploadFetchError(error, "presign");
	}

	const presign = await readPresignResponse(presignRes);
	if (!presign.ok || !presign.uploadUrl || !presign.publicUrl) {
		if (
			process.env.NODE_ENV === "development" &&
			isR2PresignUnavailableMessage(presign.error)
		) {
			return uploadViaApi(file);
		}
		throw new Error(
			presign.error ??
				`Nie udało się wysłać pliku powyżej ${VERCEL_SAFE_UPLOAD_MB} MB. Sprawdź konfigurację R2 (S3_*) i CORS na bucket.`,
		);
	}

	let putRes: Response;
	try {
		putRes = await fetch(presign.uploadUrl, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": contentType },
		});
	} catch (error) {
		throw wrapUploadFetchError(error, "r2");
	}

	if (!putRes.ok) {
		throw new Error(
			"Upload do R2 nie powiódł się. W Cloudflare R2 włącz CORS (PUT) dla domeny sklepu i panelu.",
		);
	}

	return presign.publicUrl;
}

async function uploadViaPresignedWithApiFallback(file: File): Promise<string> {
	try {
		return await uploadViaPresigned(file);
	} catch (error) {
		if (!canCompressCmsImage(file)) throw error;
		const message = error instanceof Error ? error.message : "";
		if (/za duży|Dozwolone formaty|Nieprawidłowy rozmiar/i.test(message)) {
			throw error;
		}
		const compressed = await compressCmsImageForUpload(file);
		return uploadViaApi(compressed);
	}
}

async function uploadViaApi(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("files", file);

	let res: Response;
	try {
		res = await fetch(getCmsUploadApiPath(), {
			method: "POST",
			body: formData,
			credentials: "same-origin",
		});
	} catch (error) {
		throw wrapUploadFetchError(error, "api");
	}

	const payload = await readJsonUploadResponse(res);

	if (!payload.ok) {
		if (res.status === 413 && process.env.NODE_ENV !== "development") {
			if (canCompressCmsImage(file)) {
				try {
					const compressed = await compressCmsImageForUpload(file);
					return uploadViaApi(compressed);
				} catch {
					/* presign fallback below */
				}
			}
			return uploadViaPresignedWithApiFallback(file);
		}
		throw new Error(payload.error ?? "Upload nie powiódł się. Spróbuj ponownie.");
	}

	const url = payload.urls[0];
	if (!url) throw new Error("Upload nie zwrócił adresu pliku.");
	return url;
}

/** Upload obrazu CMS z przeglądarki — API route + presigned R2 (wzorzec lumine). */
export async function uploadCmsImageFromBrowser(file: File): Promise<string> {
	const isDev = process.env.NODE_ENV === "development";
	const useDirectApi = isDev || file.size <= VERCEL_SAFE_UPLOAD_BYTES;

	if (useDirectApi) {
		try {
			return await uploadViaApi(file);
		} catch (error) {
			if (!isDev && file.size > VERCEL_SAFE_UPLOAD_BYTES) {
				return uploadViaPresignedWithApiFallback(file);
			}
			throw error;
		}
	}

	return uploadViaPresignedWithApiFallback(file);
}

export function formatCmsBrowserUploadError(error: unknown): string {
	if (isNetworkFetchError(error)) {
		return "Połączenie przerwane podczas wysyłania pliku. Spróbuj ponownie za chwilę.";
	}
	if (error instanceof Error) return error.message || "Upload nie powiódł się.";
	return "Upload nie powiódł się. Sprawdź połączenie i spróbuj ponownie.";
}

export function validateCmsBrowserUploadFile(file: File): string | null {
	if (file.size > MAX_CMS_UPLOAD_BYTES) {
		return `Plik „${file.name}” jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB).`;
	}
	return null;
}

export { prepareCmsImageForUpload };
