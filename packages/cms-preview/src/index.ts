/**
 * Etap 5 — minimalny stub @moduly/cms-preview.
 * Pełna implementacja (PreviewOverlay, attr, inline edit): lumineconcept
 * apps/storefront/lib/cms-preview + components/cms-preview.
 */

/** Protokół postMessage panel ↔ iframe podglądu (same-origin). */
export const CMS_PREVIEW_SELECT = "moduly-cms:select" as const;
export const CMS_PREVIEW_RELOAD = "moduly-cms:reload" as const;
export const CMS_PREVIEW_INLINE = "moduly-cms:inline" as const;

export type CmsPreviewInlineMessage = {
	type: typeof CMS_PREVIEW_INLINE;
	field: string;
	value: string;
};

export type CmsPreviewSelectMessage = {
	type: typeof CMS_PREVIEW_SELECT;
	field: string;
};

export type CmsPreviewReloadMessage = {
	type: typeof CMS_PREVIEW_RELOAD;
};

export type CmsPreviewMessage =
	| CmsPreviewInlineMessage
	| CmsPreviewSelectMessage
	| CmsPreviewReloadMessage;

/** Etykieta dymka nad podświetlonym elementem — uproszczony stub. */
export function cmsFieldLabel(field: string): string {
	return field.split(".").slice(-2).join(" · ");
}
