import { NextResponse, type NextRequest } from "next/server";
import { ADRES_LINII, OSOBNE_DOMENY, czyHostWulkanizacji } from "./lib/linie";
import { modulyConfig } from "./moduly.config";

/**
 * 1. Domena wulkanizacji: wulkanizacja-lacko.pl/ serwuje trasę /wulkanizacja
 *    (rewrite), a /wulkanizacja pod tą domeną wraca na „/", żeby strona nie
 *    miała dwóch adresów. Panel zostaje na domenie detailingu (tam jest cookie
 *    sesji).
 * 2. Domena detailingu: po włączeniu osobnych domen stary adres
 *    /wulkanizacja przekierowuje na stałe na wulkanizacja-lacko.pl.
 * 3. Ochrona panelu admina — bramka na cookie sesji.
 *    Pełna walidacja JWT i allowlisty odbywa się server-side (`requireAdminSessionForPanel`).
 */
const SESSION_COOKIE = modulyConfig.auth.cookieName;
const PANEL_PREFIX = `${modulyConfig.basePath}/panel`;
/** Materiały do druku — poza layoutem panelu (bez sidebara), ale za tym samym logowaniem. */
const DRUK_PREFIX = `${modulyConfig.basePath}/druk`;
const LOGIN_PATH = modulyConfig.basePath;
const WULKANIZACJA = "/wulkanizacja";

const podSciezka = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");

  if (czyHostWulkanizacji(host)) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL(`${WULKANIZACJA}${search}`, request.url));
    }
    if (podSciezka(pathname, WULKANIZACJA)) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 308);
    }
    if (podSciezka(pathname, LOGIN_PATH)) {
      return NextResponse.redirect(`${ADRES_LINII.detailing}${pathname}${search}`, 307);
    }
    return NextResponse.next();
  }

  if (OSOBNE_DOMENY && podSciezka(pathname, WULKANIZACJA)) {
    return NextResponse.redirect(`${ADRES_LINII.wulkanizacja}/${search}`, 308);
  }

  const isPanel = [PANEL_PREFIX, DRUK_PREFIX].some((prefix) => podSciezka(pathname, prefix));
  if (!isPanel) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Strony, bez statyków i API (plik z kropką = asset, sitemap.xml, robots.txt).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
