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
const SKALA_300_DPI = 300 / 96;
const A4_MM = { szer: 210, wys: 297 } as const;

function pobierz(href: string, nazwa: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = nazwa;
  document.body.append(a);
  a.click();
  a.remove();
}

/**
 * Kartka renderowana od razu w docelowym rozmiarze (transform: scale), a nie
 * przez `pixelRatio`. html-to-image robi z kartki SVG 1:1 i przy `pixelRatio`
 * tylko rozciąga go na canvasie — Safari rastruje taki SVG w rozmiarze
 * naturalnym i powiększa bitmapę, więc plik wychodził rozmyty.
 */
async function kartkaDoPng(kartka: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  const szer = kartka.offsetWidth;
  const wys = kartka.offsetHeight;
  const opcje = {
    width: Math.round(szer * SKALA_300_DPI),
    height: Math.round(wys * SKALA_300_DPI),
    pixelRatio: 1,
    cacheBust: false,
    backgroundColor: "#ffffff",
    style: {
      width: `${szer}px`,
      height: `${wys}px`,
      transform: `scale(${SKALA_300_DPI})`,
      transformOrigin: "top left",
      // Na ekranie kartka ma margines (wyśrodkowanie) i cień — w pliku ich nie chcemy.
      margin: "0",
      boxShadow: "none",
    },
  };
  // Pierwszy przebieg w Safari potrafi zgubić czcionki i obrazki (ładują się
  // dopiero do wnętrza SVG) — rozgrzewka, potem właściwy render.
  await toPng(kartka, opcje);
  return toPng(kartka, opcje);
}

export async function eksportujKartki(format: FormatEksportu, nazwaPliku: string, skala: HTMLElement | null) {
  const kartki = [...document.querySelectorAll<HTMLElement>(".arkusz-a4")];
  if (!kartki.length) return;

  // Powiększenie podglądu nie może trafić do pliku — na czas zapisu 1:1.
  const poprzedniZoom = skala?.style.zoom ?? "";
  if (skala) skala.style.zoom = "1";

  try {
    if (format === "png") {
      for (const [i, kartka] of kartki.entries()) {
        const dataUrl = await kartkaDoPng(kartka);
        const przyrostek = kartki.length > 1 ? `-${i + 1}` : "";
        pobierz(dataUrl, `${nazwaPliku}${przyrostek}.png`);
      }
      return;
    }

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    for (const [i, kartka] of kartki.entries()) {
      // PNG, nie JPEG: JPEG brudzi krawędzie liter i cienkie linie tabel artefaktami.
      const dataUrl = await kartkaDoPng(kartka);
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(dataUrl, "PNG", 0, 0, A4_MM.szer, A4_MM.wys, undefined, "FAST");
    }
    pdf.save(`${nazwaPliku}.pdf`);
  } finally {
    if (skala) skala.style.zoom = poprzedniZoom;
  }
}
