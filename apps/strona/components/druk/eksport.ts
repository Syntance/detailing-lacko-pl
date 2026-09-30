/**
 * Zapis kartek A4 do pliku bez okna drukowania: każda `.arkusz-a4` jest
 * renderowana do obrazu w 300 dpi (html-to-image), a PDF składa z nich jsPDF.
 * PDF jest rastrowy — przy 300 dpi to jakość drukarni, a w zamian wygląda
 * 1:1 jak podgląd (kolory tła, czcionki, skala dopasowania treści).
 *
 * Biblioteki ładujemy dopiero po kliknięciu, żeby nie ciążyły podglądowi.
 */

export type FormatEksportu = "pdf" | "png";

/** 300 dpi względem 96 px CSS na cal. */
const PIXEL_RATIO = 300 / 96;
const A4_MM = { szer: 210, wys: 297 } as const;

function pobierz(href: string, nazwa: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = nazwa;
  document.body.append(a);
  a.click();
  a.remove();
}

export async function eksportujKartki(format: FormatEksportu, nazwaPliku: string, skala: HTMLElement | null) {
  const kartki = [...document.querySelectorAll<HTMLElement>(".arkusz-a4")];
  if (!kartki.length) return;

  // Powiększenie podglądu nie może trafić do pliku — na czas zapisu 1:1.
  const poprzedniZoom = skala?.style.zoom ?? "";
  if (skala) skala.style.zoom = "1";

  try {
    const { toJpeg, toPng } = await import("html-to-image");
    const opcje = {
      pixelRatio: PIXEL_RATIO,
      cacheBust: false,
      backgroundColor: "#ffffff",
      // Na ekranie kartka ma margines (wyśrodkowanie) i cień — w pliku ich nie chcemy.
      style: { margin: "0", boxShadow: "none" },
    };

    if (format === "png") {
      for (const [i, kartka] of kartki.entries()) {
        const dataUrl = await toPng(kartka, opcje);
        const przyrostek = kartki.length > 1 ? `-${i + 1}` : "";
        pobierz(dataUrl, `${nazwaPliku}${przyrostek}.png`);
      }
      return;
    }

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    for (const [i, kartka] of kartki.entries()) {
      // JPEG zamiast PNG: przy 300 dpi PNG kartki waży kilkanaście MB.
      const dataUrl = await toJpeg(kartka, { ...opcje, quality: 0.92 });
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(dataUrl, "JPEG", 0, 0, A4_MM.szer, A4_MM.wys, undefined, "FAST");
    }
    pdf.save(`${nazwaPliku}.pdf`);
  } finally {
    if (skala) skala.style.zoom = poprzedniZoom;
  }
}
