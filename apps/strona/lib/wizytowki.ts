import type { Linia } from "./linie";

/**
 * Wizytówki Google Maps obu linii — linki udostępniania z Google Maps.
 * Sprawdzone przekierowaniem: detailing → „Detailing samochodowy Łącko",
 * wulkanizacja → „Wulkanizacja Łącko". Jedno źródło dla strony wyboru
 * /mapy i mapy w hero wulkanizacji.
 */
export const WIZYTOWKI_GOOGLE: Record<Linia, string> = {
  detailing: "https://maps.app.goo.gl/QAJcmjwxkBeaCbgz9",
  wulkanizacja: "https://maps.app.goo.gl/KGFUyxNjmmi1RH3y8",
};
