import { defaultModulyConfig, type ModulyConfig } from "@moduly/config";

export type MagazynCoreConfig = {
	/** Nazwa cookie z tokenem JWT admina — z `moduly.config.ts` → `auth.cookieName`. */
	adminCookieName: string;
};

let adminCookieName = defaultModulyConfig.auth.cookieName;
let modulyConfig: ModulyConfig = defaultModulyConfig;

/** Ustaw cookie sesji admina (wywołaj raz przy starcie aplikacji z `moduly.config.ts`). */
export function configureMagazynCore(config: MagazynCoreConfig): void {
	adminCookieName = config.adminCookieName;
}

/** Pełna konfiguracja instancji Moduly — wywołaj raz w `moduly.config.ts`. */
export function configureMagazynModules(config: ModulyConfig): void {
	modulyConfig = config;
	configureMagazynCore({ adminCookieName: config.auth.cookieName });
}

export function getAdminCookieName(): string {
	return adminCookieName;
}

export function getModulyConfig(): ModulyConfig {
	return modulyConfig;
}

const DEFAULT_CMS_UPLOAD_API_PATH = "/api/magazyn/cms-upload";

/** Ścieżka Route Handlera uploadu CMS (konfiguracja w `moduly.config.ts` → `storage`). */
export function getCmsUploadApiPath(): string {
	return modulyConfig.storage?.cmsUploadApiPath ?? DEFAULT_CMS_UPLOAD_API_PATH;
}

/** Ścieżka presigned PUT do R2 (pliki > ~4 MB na Vercel). */
export function getCmsUploadPresignApiPath(): string {
	return (
		modulyConfig.storage?.cmsUploadPresignApiPath ??
		`${getCmsUploadApiPath()}/presign`
	);
}
