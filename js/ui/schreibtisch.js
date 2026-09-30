/**
 * Schreibtisch
 * ------------
 * Baut den klassischen Schreibtischtest auf: eine Tabelle, die für jeden
 * ausgeführten Schritt eine Zeile mit den aktuellen Variablenwerten anlegt –
 * genau wie beim Schreibtischtest auf Papier, nur dass TRACE das Mitschreiben
 * übernimmt. Spalten entstehen automatisch, sobald eine neue Variable zum
 * ersten Mal auftaucht.
 *
 * Die Tabelle wächst nur nach vorne: "Schritt zurück" blendet spätere Zeilen
 * nur aus (statt sie zu löschen), damit erneutes Vorwärtsgehen sie nicht neu
 * aufbauen muss. Bei sehr vielen Schritten (z. B. Sortieren mit 100 Zahlen)
 * wird das Mitschreiben ab einer Grenze eingestellt – für so viele Zeilen
 * eignet sich ein Schreibtischtest ohnehin nicht mehr.
 */
window.TRACE = window.TRACE || {};

(function (TRACE) {
  "use strict";

  const MAX_ZEILEN = 500;

  /** Schreibt Werte so, wie man sie im Pseudocode schreiben würde. */
  function formatiere(wert) {
    if (wert === undefined || wert === null) return "–";
    if (wert === true) return "wahr";
    if (wert === false) return "falsch";
    return String(wert);
  }

  class Schreibtisch {
    /** @param {HTMLElement} wurzel scrollbarer Container für die Tabelle */
    constructor(wurzel) {
      this.wurzel = wurzel;
      this.neuBeginnen();
    }

    /** Verwirft die bisherige Tabelle – bei neuem Algorithmus oder neuen Werten. */
    neuBeginnen() {
      this.spalten = [];  // bekannte Variablennamen, in Reihenfolge des ersten Auftretens
      this.zeilen = [];   // <tr>-Elemente, ein Eintrag pro bisher gezeigtem Schritt
      this.aktiveZeile = null;
      this.abgeschnitten = false;

      this.kopfzeile = document.createElement("tr");
      const kopfNummer = document.createElement("th");
      kopfNummer.textContent = "Schritt";
      kopfNummer.scope = "col";
      this.kopfzeile.append(kopfNummer);

      const thead = document.createElement("thead");
      thead.append(this.kopfzeile);
      this.koerper = document.createElement("tbody");

      const tabelle = document.createElement("table");
      tabelle.className = "schreibtisch-tabelle";
      tabelle.append(thead, this.koerper);

      this.wurzel.replaceChildren(tabelle);
      this.wurzel.scrollTop = 0;
    }

    /**
     * @param {Array<object>} schritte  alle bisher bekannten Schritte, der Reihe nach
     * @param {number} index  welcher Schritt gerade aktiv angezeigt wird
     */
    zeige(schritte, index) {
      while (this.zeilen.length <= index && this.zeilen.length < schritte.length) {
        if (this.zeilen.length >= MAX_ZEILEN) {
          this._zeigeAbschnitt();
          break;
        }
        this._ergaenzeZeile(schritte[this.zeilen.length]);
      }

      // Zeilen, die (nach "Schritt zurück") wieder in der Zukunft liegen, nur ausblenden.
      for (let i = 0; i < this.zeilen.length; i++) {
        this.zeilen[i].hidden = i > index;
      }

      const aktuell = this.zeilen[index] || null;
      if (aktuell === this.aktiveZeile) return;

      if (this.aktiveZeile) this.aktiveZeile.classList.remove("aktiv");
      this.aktiveZeile = aktuell;
      if (aktuell) {
        aktuell.classList.add("aktiv");
        this._inSichtBringen(aktuell);
      }
    }

    // ------------------------------------------------------------------
    // intern
    // ------------------------------------------------------------------

    _ergaenzeZeile(schritt) {
      const variablen = schritt.variablen || {};

      // Neue Spalte ergänzen, wenn diese Zeile eine bisher unbekannte Variable zeigt.
      for (const name of Object.keys(variablen)) {
        if (this.spalten.includes(name)) continue;
        this.spalten.push(name);

        const th = document.createElement("th");
        th.textContent = name;
        th.scope = "col";
        this.kopfzeile.append(th);

        for (const alteZeile of this.zeilen) {
          const leer = document.createElement("td");
          leer.textContent = "–";
          alteZeile.append(leer);
        }
      }

      const vorherigeWerte = this.zeilen.length
        ? this.zeilen[this.zeilen.length - 1]._werte
        : {};

      const zeile = document.createElement("tr");
      zeile._werte = variablen;

      const nummer = document.createElement("td");
      nummer.className = "schreibtisch-nummer";
      nummer.textContent = String(this.zeilen.length + 1);
      zeile.append(nummer);

      for (const name of this.spalten) {
        const td = document.createElement("td");
        const wert = variablen[name];
        td.textContent = formatiere(wert);
        if (name in variablen && vorherigeWerte[name] !== wert) td.classList.add("geaendert");
        zeile.append(td);
      }

      this.koerper.append(zeile);
      this.zeilen.push(zeile);
    }

    _zeigeAbschnitt() {
      if (this.abgeschnitten) return;
      this.abgeschnitten = true;
      const hinweis = document.createElement("p");
      hinweis.className = "schreibtisch-hinweis";
      hinweis.textContent =
        `Ab Schritt ${MAX_ZEILEN} schreibt TRACE nicht weiter mit – für so viele Zeilen eignet sich ein ` +
        "Schreibtischtest ohnehin nicht mehr. Für einen echten Schreibtischtest lieber kleine Beispiele " +
        "nehmen, etwa 10 bis 20 Zahlen.";
      this.wurzel.append(hinweis);
    }

    /** Scrollt nur die Tabelle, nie die ganze Seite. */
    _inSichtBringen(zeile) {
      const box = this.wurzel;
      const oben = zeile.offsetTop;
      const unten = oben + zeile.offsetHeight;
      if (oben < box.scrollTop || unten > box.scrollTop + box.clientHeight) {
        box.scrollTop = oben - box.clientHeight / 2;
      }
    }
  }

  TRACE.Schreibtisch = Schreibtisch;
})(window.TRACE);
