import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv, type R2Config } from "../env";
import { serviceAdminUpload } from "../medusa/client";
import { resolveMedusaMediaUrl } from "../medusa/media-url";
import {
	MAX_CMS_UPLOAD_BYTES,
	MAX_CMS_UPLOAD_MB,
	VERCEL_SAFE_UPLOAD_MB,
} from "./cms-image-config";
import { inferCmsMimeFromMeta, inferCmsMimeType } from "./cms-mime";
import { prepareCmsUploadFile } from "./normalize-cms-image";

export {
	MAX_CMS_UPLOAD_BYTES,
	MAX_CMS_UPLOAD_MB,
	VERCEL_SAFE_UPLOAD_MB,
} from "./cms-image-config";

const CMS_UPLOAD_PREFIX = "cms-uploads";

export type CmsUploadResult = {
	url: string;
	filename: string;
	size: number;
};

export type CmsPresignedUpload = {
	uploadUrl: string;
	publicUrl: string;
};

const R2_UPLOAD_TIMEOUT_MS = 15_000;
const LARGE_R2_UPLOAD_TIMEOUT_MS = 120_000;

let cachedR2: S3Client | null = null;

export function isCmsR2UploadConfigured(): boolean {
	return serverEnv.r2Config !== null;
}

async function withUploadTimeout<T>(
	promise: Promise<T>,
	label: string,
	timeoutMs = R2_UPLOAD_TIMEOUT_MS,
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => {
					reject(new Error(`${label}_TIMEOUT`));
				}, timeoutMs);
			}),
		]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

function getOrCreateR2Client(config: R2Config): S3Client {
	if (!cachedR2) {
		cachedR2 = new S3Client({
			region: config.region,
			endpoint: config.endpoint,
			forcePathStyle: true,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}
	return cachedR2;
}

function buildCmsUploadKey(filename: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).slice(2, 8);
	const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
	return `${CMS_UPLOAD_PREFIX}/${timestamp}-${random}-${safeName}`;
}

function resolveMedusaFileUrl(url: string): string {
	if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
	const resolved = resolveMedusaMediaUrl(url);
	return resolved ?? url;
}

async function uploadViaR2(
	file: File,
	config: R2Config,
	timeoutMs = R2_UPLOAD_TIMEOUT_MS,
): Promise<CmsUploadResult> {
	const key = buildCmsUploadKey(file.name);
	const contentType =
		inferCmsMimeType(file) ?? (file.type || "application/octet-stream");
	const body = new Uint8Array(await file.arrayBuffer());

	await withUploadTimeout(
		getOrCreateR2Client(config).send(
			new PutObjectCommand({
				Bucket: config.bucket,
				Key: key,
				Body: body,
				ContentLength: body.byteLength,
				ContentType: contentType,
			}),
		),
		"R2_UPLOAD",
		timeoutMs,
	);

	const base = config.fileUrl.replace(/\/$/, "");
	return { url: `${base}/${key}`, filename: file.name, size: file.size };
}

async function uploadViaMedusa(file: File): Promise<CmsUploadResult> {
	const urls = await serviceAdminUpload([file]);
	const url = urls[0];
	if (!url) throw new Error("MEDUSA_UPLOAD_EMPTY");

	return {
		url: resolveMedusaFileUrl(url),
		filename: file.name,
		size: file.size,
	};
}

export function validateCmsUploadFile(file: File): string | null {
	if (file.size > MAX_CMS_UPLOAD_BYTES) {
		return `Plik jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP lub zmniejsz rozdzielczość.`;
	}
	if (!inferCmsMimeType(file)) {
		return "Dozwolone formaty: JPG, PNG, WEBP, GIF, AVIF.";
	}
	return null;
}

export function validateCmsUploadMeta(
	filename: string,
	contentType: string,
	size: number,
): string | null {
	if (size > MAX_CMS_UPLOAD_BYTES) {
		return `Plik jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP lub zmniejsz rozdzielczość.`;
	}
	if (size <= 0) return "Nieprawidłowy rozmiar pliku.";
	if (!inferCmsMimeFromMeta(filename, contentType)) {
		return "Dozwolone formaty: JPG, PNG, WEBP, GIF, AVIF.";
	}
	return null;
}

export function formatCmsUploadError(error: unknown): string {
	if (!(error instanceof Error)) {
		return "Upload nie powiódł się. Spróbuj ponownie.";
	}

	const msg = error.message;
	if (msg.includes("Plik jest za duży") || msg.includes("Dozwolone formaty")) return msg;
	if (msg === "R2_UPLOAD_TIMEOUT") {
		return "Upload trwa zbyt długo. Spróbuj ponownie lub mniejszy plik (JPG/WebP).";
	}
	if (msg.startsWith("MEDUSA_UPLOAD_FAILED_413")) {
		return `Plik jest za duży dla serwera (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP.`;
	}
	if (msg.startsWith("MEDUSA_UPLOAD_FAILED_")) {
		return `Serwer odrzucił plik. Spróbuj JPG/WebP do ${MAX_CMS_UPLOAD_MB} MB.`;
	}
	if (msg === "R2_UPLOAD_FAILED" || msg.endsWith("_TIMEOUT")) {
		return "Upload do magazynu plików nie powiódł się. Spróbuj ponownie.";
	}
	if (msg === "R2_PRESIGN_UNAVAILABLE") {
		return `Pliki powyżej ${VERCEL_SAFE_UPLOAD_MB} MB wymagają R2 (S3_* na Vercel). Zmniejsz plik lub skonfiguruj magazyn.`;
	}
	if (msg === "MEDUSA_UPLOAD_UNAVAILABLE") {
		return "Magazyn plików niedostępny. Ustaw S3/R2 (S3_*) na Vercel lub MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD.";
	}
	if (msg.startsWith("MEDUSA_")) {
		return `Upload nie powiódł się. Spróbuj JPG/WebP do ${MAX_CMS_UPLOAD_MB} MB.`;
	}
	return msg;
}

/** Assety CMS (hero, galeria, OG) — R2 z timeoutem; fallback Medusa gdy R2 niedostępne. */
export async function uploadCmsAssetFile(file: File): Promise<CmsUploadResult> {
	const validationError = validateCmsUploadFile(file);
	if (validationError) throw new Error(validationError);

	const prepared = await prepareCmsUploadFile(file);
	const normalizedValidation = validateCmsUploadFile(prepared);
	if (normalizedValidation) throw new Error(normalizedValidation);

	const r2 = serverEnv.r2Config;
	if (r2) {
		try {
			return await uploadViaR2(prepared, r2, LARGE_R2_UPLOAD_TIMEOUT_MS);
		} catch (error) {
			try {
				return await uploadViaMedusa(prepared);
			} catch {
				if (error instanceof Error && error.message === "R2_UPLOAD_TIMEOUT") {
					throw new Error(
						"Upload do R2 trwa zbyt długo. Sprawdź połączenie lub spróbuj mniejszego pliku (WebP/JPG).",
					);
				}
				throw error instanceof Error ? error : new Error("R2_UPLOAD_FAILED");
			}
		}
	}

	return uploadViaMedusa(prepared);
}

/** Presigned PUT — upload z przeglądarki prosto do R2 (omija limit body Vercel ~4.5 MB). */
export async function createCmsPresignedUpload(params: {
	filename: string;
	contentType: string;
	size: number;
}): Promise<CmsPresignedUpload> {
	const validationError = validateCmsUploadMeta(
		params.filename,
		params.contentType,
		params.size,
	);
	if (validationError) throw new Error(validationError);

	const r2 = serverEnv.r2Config;
	if (!r2) throw new Error("R2_PRESIGN_UNAVAILABLE");

	const resolvedType = inferCmsMimeFromMeta(params.filename, params.contentType);
	if (!resolvedType) throw new Error("Dozwolone formaty: JPG, PNG, WEBP, GIF, AVIF.");

	const key = buildCmsUploadKey(params.filename);
	const client = getOrCreateR2Client(r2);

	const uploadUrl = await getSignedUrl(
		client,
		new PutObjectCommand({
			Bucket: r2.bucket,
			Key: key,
			ContentType: resolvedType,
			ContentLength: params.size,
		}),
		{ expiresIn: 600 },
	);

	const base = r2.fileUrl.replace(/\/$/, "");
	return { uploadUrl, publicUrl: `${base}/${key}` };
}

export async function uploadCmsMediaFiles(files: File[]): Promise<string[]> {
	const urls: string[] = [];
	for (const file of files) {
		const result = await uploadCmsAssetFile(file);
		urls.push(result.url);
	}
	return urls;
}
