"use client";

import { useEffect, useRef, useState } from "react";
import { getConsent } from "@moduly/legal-consent";
import { hasConsent, subscribeConsentUpdates } from "./consent";
import { track } from "./track";

export type TrackedSection = {
	/** Wartość atrybutu `id` elementu sekcji w DOM. */
	id: string;
	/** Czytelna nazwa do raportów (GA4/PostHog). */
	name: string;
};

const SCROLL_MARKS = [25, 50, 75, 90] as const;

/**
 * Pomiar ruchu wewnątrz strony (one-page): section_view — raz na wizytę, gdy
 * sekcja jest naprawdę obejrzana — oraz scroll_depth (25/50/75/90%).
 *
 * Pomiar startuje dopiero PO zgodzie analitycznej (consentReady), a nie tylko
 * w track(): gdyby znaczniki konsumowały się przed zgodą, sekcje minięte
 * z otwartym banerem nigdy nie zostałyby zmierzone po akceptacji — hero
 * brakowałoby w praktycznie każdej pierwszej wizycie. Po zgodzie obserwator
 * powstaje na nowo (observe() zawsze dostarcza callback startowy, więc sekcja
 * widoczna w chwili zgody liczy się od razu), a measure() dogania minięte
 * progi scrolla. Deduplikacja w refach — przetrwa cofnięcie i ponowne
 * nadanie zgody bez podwójnych eventów.
 */
export function TrafficTracker({ sections = [] }: { sections?: TrackedSection[] }) {
	const seenSectionsRef = useRef<Set<string>>(new Set());
	const firedMarksRef = useRef<Set<number>>(new Set());
	const [consentReady, setConsentReady] = useState(false);

	useEffect(() => {
		const existing = getConsent();
		if (existing) setConsentReady(existing.analytics);
		return subscribeConsentUpdates((state) => setConsentReady(state.analytics));
	}, []);

	useEffect(() => {
		if (!consentReady) return;
		if (typeof IntersectionObserver === "undefined" || sections.length === 0) {
			return;
		}

		const byElement = new Map<Element, TrackedSection>();
		for (const section of sections) {
			if (seenSectionsRef.current.has(section.id)) continue;
			const el = document.getElementById(section.id);
			if (el) byElement.set(el, section);
		}
		if (byElement.size === 0) return;

		// Sekcja „obejrzana": ≥40% jej wysokości w kadrze ALBO wypełnia ≥50%
		// viewportu — sekcje wyższe niż ekran nigdy nie osiągną ratio 0.4,
		// stąd drabinka progów i drugi warunek.
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const fillsViewport =
						entry.intersectionRect.height >= window.innerHeight * 0.5;
					if (entry.intersectionRatio < 0.4 && !fillsViewport) continue;

					const section = byElement.get(entry.target);
					if (!section || !hasConsent("analytics")) continue;
					byElement.delete(entry.target);
					observer.unobserve(entry.target);
					seenSectionsRef.current.add(section.id);
					track("section_view", {
						section_id: section.id,
						section_name: section.name,
					});
				}
			},
			{ threshold: [0, 0.1, 0.2, 0.3, 0.4] },
		);

		for (const el of byElement.keys()) observer.observe(el);
		return () => observer.disconnect();
	}, [sections, consentReady]);

	useEffect(() => {
		if (!consentReady) return;

		const fired = firedMarksRef.current;
		let ticking = false;

		const measure = () => {
			ticking = false;
			if (fired.size === SCROLL_MARKS.length) return;
			if (!hasConsent("analytics")) return;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			if (max <= 0) return;
			const percent = (window.scrollY / max) * 100;
			for (const mark of SCROLL_MARKS) {
				if (percent >= mark && !fired.has(mark)) {
					fired.add(mark);
					track("scroll_depth", { depth_percent: mark });
				}
			}
		};

		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			window.requestAnimationFrame(measure);
		};

		// Dogonienie stanu: użytkownik mógł doscrollować np. do 60% zanim
		// kliknął zgodę — progi 25/50 lecą w momencie jej nadania.
		measure();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [consentReady]);

	return null;
}
