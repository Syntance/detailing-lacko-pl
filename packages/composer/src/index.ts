/**
 * Etap 5 — @moduly/composer (port rdzenia z lumineconcept).
 * Pełny renderer/edytor pozostaje w apps/storefront do czasu kolejnego PR.
 */

import { z } from "zod";

export const SECTION_TYPE_IDS = [
	"hero",
	"textImage",
	"richText",
	"gallery",
	"faq",
	"testimonials",
	"cta",
	"categoryTiles",
	"bestsellers",
	"divider",
	"contactForm",
	"embedMap",
	"about",
	"socialProof",
] as const;

export type SectionTypeId = (typeof SECTION_TYPE_IDS)[number];

export type SectionRegistryEntry = {
	type: SectionTypeId;
	label: string;
	description: string;
	preview: string;
	ownsPageH1?: boolean;
};

export const SECTION_REGISTRY: SectionRegistryEntry[] = [
	{ type: "hero", label: "Hero", description: "Nagłówek z tłem, CTA", preview: "Baner + CTA", ownsPageH1: true },
	{ type: "bestsellers", label: "Bestsellery", description: "Siatka produktów", preview: "Produkty" },
	{ type: "socialProof", label: "Social proof", description: "Pasek zaufania", preview: "UVP" },
	{ type: "cta", label: "CTA", description: "Wezwanie do działania", preview: "Przycisk" },
	{ type: "textImage", label: "Tekst + obraz", description: "Dwie kolumny", preview: "Copy + foto" },
	{ type: "richText", label: "Tekst sformatowany", description: "HTML ograniczony", preview: "Akapit" },
	{ type: "gallery", label: "Galeria", description: "Siatka zdjęć", preview: "Realizacje" },
	{ type: "faq", label: "FAQ", description: "Pytania i odpowiedzi", preview: "Akordeon" },
	{ type: "testimonials", label: "Opinie", description: "Cytaty klientów", preview: "Karty" },
	{ type: "categoryTiles", label: "Kafle kategorii", description: "Linki do kategorii", preview: "Kafle" },
	{ type: "about", label: "O nas", description: "Bloki o marce", preview: "Intro/misja" },
	{ type: "divider", label: "Separator", description: "Linia lub odstęp", preview: "Linia" },
	{ type: "contactForm", label: "Kontakt", description: "Link do formularza", preview: "/kontakt" },
	{ type: "embedMap", label: "Mapa", description: "iframe mapy", preview: "Mapa" },
];

export const layoutAlignSchema = z.enum(["left", "center", "right"]);

export const sectionLayoutSchema = z.object({
	align: layoutAlignSchema.default("center"),
	size: z.enum(["sm", "md", "lg"]).default("md"),
	columns: z.enum(["1", "2", "3", "4"]).default("1"),
	spacing: z.enum(["sm", "md", "lg"]).default("md"),
	background: z.enum(["none", "muted", "brand", "image"]).default("none"),
	fullWidth: z.boolean().default(false),
	variant: z.enum(["light", "dark"]).default("light"),
});

const heroPropsSchema = z.object({
	headline: z.string().min(1).max(200),
	description: z.string().min(1).max(2000),
	ctaLabel: z.string().min(1).max(120),
	ctaHref: z.string().min(1).max(512),
});

export const pageSectionSchema = z.discriminatedUnion("type", [
	z.object({ id: z.string(), type: z.literal("hero"), props: heroPropsSchema }),
	z.object({
		id: z.string(),
		type: z.literal("richText"),
		props: z.object({ bodyHtml: z.string().max(20_000) }),
	}),
]);

export type PageSection = z.infer<typeof pageSectionSchema>;

export const pageSectionsArraySchema = z.array(pageSectionSchema).max(20);

export type PageSections = z.infer<typeof pageSectionsArraySchema>;

export function parseInlineEditValue(raw: string, mode: "text" | "html" = "text"): string {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	if (mode === "text") return trimmed.replace(/<[^>]*>/g, "").trim();
	return trimmed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}
