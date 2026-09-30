/**
 * Farbschema umschalten
 * ---------------------
 * Ein Knopf im Kopfbereich schaltet zwischen drei Zuständen um: System (folgt
 * der Betriebssystem-Einstellung), Hell und Dunkel. Die Wahl wird im lokalen
 * Speicher gemerkt. Das eigentliche Setzen des Farbschemas beim Laden passiert
 * schon in einem kleinen Inline-Skript im <head> von index.html, damit die
 * Seite nicht kurz im falschen Schema aufblitzt, bevor dieses Skript läuft.
 */
window.TRACE = window.TRACE || {};

(function (TRACE) {
  "use strict";

  const SPEICHER_SCHLUESSEL = "trace-theme";
  const ABFOLGE = ["system", "hell", "dunkel"];
  const ICON = { system: "🖥️", hell: "☀️", dunkel: "🌙" };
  const BESCHRIFTUNG = { system: "System", hell: "Hell", dunkel: "Dunkel" };

  function aktuelleEinstellung() {
    try {
      const wert = localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (ABFOLGE.includes(wert)) return wert;
    } catch { /* lokaler Speicher nicht verfügbar */ }
    return "system";
  }

  function anwenden(einstellung) {
    if (einstellung === "system") {
      delete document.documentElement.dataset.theme;
      document.documentElement.style.colorScheme = "light dark";
    } else {
      document.documentElement.dataset.theme = einstellung;
      document.documentElement.style.colorScheme = einstellung === "dunkel" ? "dark" : "light";
    }
    // Canvas-Zeichnungen (Balken, Gitter, Baum, …) lesen Farben nur beim
    // Zeichnen aus den CSS-Variablen und hören sonst nur auf Änderungen der
    // Systemeinstellung – dieses Ereignis sorgt dafür, dass sie auch beim
    // manuellen Umschalten hier neu zeichnen.
    window.dispatchEvent(new Event("trace:farbschema-geaendert"));
  }

  function aktualisiereKnopf(knopf, einstellung) {
    knopf.textContent = ICON[einstellung];
    const beschriftung = `Farbschema: ${BESCHRIFTUNG[einstellung]} (klicken zum Wechseln)`;
    knopf.title = beschriftung;
    knopf.setAttribute("aria-label", beschriftung);
  }

  const knopf = document.getElementById("theme-knopf");
  if (knopf) {
    let einstellung = aktuelleEinstellung();
    anwenden(einstellung);
    aktualisiereKnopf(knopf, einstellung);

    knopf.addEventListener("click", () => {
      einstellung = ABFOLGE[(ABFOLGE.indexOf(einstellung) + 1) % ABFOLGE.length];
      anwenden(einstellung);
      aktualisiereKnopf(knopf, einstellung);
      try {
        localStorage.setItem(SPEICHER_SCHLUESSEL, einstellung);
      } catch { /* lokaler Speicher nicht verfügbar – Wahl gilt nur für diesen Besuch */ }
    });
  }
})(window.TRACE);
