/**
 * Code-Ansicht
 * ------------
 * Zeigt den Code eines Algorithmus mit Zeilennummern und markiert die Zeile,
 * die gerade ausgeführt wird.
 *
 * Zeilen werden nicht über ihre Nummer angesprochen, sondern über eine Marke.
 * Im Code-Text steht dafür am Zeilenende z. B. `@@vergleich`. Die Marke wird
 * beim Anzeigen entfernt. Vorteil: Pseudocode, C# und JavaScript haben
 * unterschiedlich viele Zeilen, aber dieselben Marken. Ein Schritt-Objekt mit
 * `zeile: "vergleich"` passt so zu jeder Sprache.
 */
window.TRACE = window.TRACE || {};

(function (TRACE) {
  "use strict";

  const MARKE = /\s*@@([\w-]+)\s*$/;
  const SCHLUESSELWOERTER = new RegExp(
    "\\b(" +
      // Pseudocode (Deutsch, IHK-Stil)
      "PROZEDUR|ENDE|FÜR|BIS|WENN|DANN|SONST|SOLANGE|UND|ODER|NICHT|WAHR|FALSCH|ABBRUCH|RÜCKGABE|" +
      // C# und JavaScript
      "void|int|bool|string|let|const|function|for|if|else|while|return|true|false|break|new" +
    ")\\b",
    "g"
  );

  /** Entfernt leere Zeilen am Anfang/Ende und die gemeinsame Einrückung. */
  function bereinige(quelltext) {
    const zeilen = quelltext.replace(/\t/g, "  ").split("\n");
    while (zeilen.length && !zeilen[0].trim()) zeilen.shift();
    while (zeilen.length && !zeilen[zeilen.length - 1].trim()) zeilen.pop();

    const einrueckung = Math.min(
      ...zeilen.filter((z) => z.trim()).map((z) => z.match(/^ */)[0].length)
    );
    return zeilen.map((z) => z.slice(einrueckung));
  }

  /** Baut eine Zeile als DOM-Knoten, Schlüsselwörter und Kommentare hervorgehoben. */
  function fuelleZeile(element, text) {
    const kommentarStart = text.indexOf("//");
    const code = kommentarStart >= 0 ? text.slice(0, kommentarStart) : text;
    const kommentar = kommentarStart >= 0 ? text.slice(kommentarStart) : "";

    let letzteStelle = 0;
    for (const treffer of code.matchAll(SCHLUESSELWOERTER)) {
      element.append(code.slice(letzteStelle, treffer.index));
      const wort = document.createElement("span");
      wort.className = "schluessel";
      wort.textContent = treffer[0];
      element.append(wort);
      letzteStelle = treffer.index + treffer[0].length;
    }
    element.append(code.slice(letzteStelle));

    if (kommentar) {
      const span = document.createElement("span");
      span.className = "kommentar";
      span.textContent = kommentar;
      element.append(span);
    }
    if (!text) element.append(" "); // leere Zeilen behalten ihre Höhe
  }

  class Codeansicht {
    /** @param {HTMLElement} wurzel scrollbarer Container für den Code */
    constructor(wurzel) {
      this.wurzel = wurzel;
      this.aktiveZeile = null;
    }

    /** Setzt einen neuen Code-Text (mit @@marken). */
    setzeCode(quelltext) {
      const zeilenOhneMarken = [];
      const liste = document.createElement("ol");
      for (const zeile of bereinige(quelltext)) {
        const eintrag = document.createElement("li");
        const treffer = zeile.match(MARKE);
        if (treffer) eintrag.dataset.marke = treffer[1];
        const zeileOhneMarke = treffer ? zeile.slice(0, treffer.index) : zeile;
        zeilenOhneMarken.push(zeileOhneMarke);
        // Eigener Container für den Text, damit die führenden Leerzeichen
        // (Einrückung) im Flex-Layout der Zeile erhalten bleiben.
        const text = document.createElement("span");
        fuelleZeile(text, zeileOhneMarke);
        eintrag.append(text);
        liste.append(eintrag);
      }
      this.wurzel.replaceChildren(liste);
      this.aktiveZeile = null;
      this.wurzel.scrollTop = 0;
      this._text = zeilenOhneMarken.join("\n");
    }

    /** Der aktuell angezeigte Code als reiner Text, ohne @@marken. */
    holeText() {
      return this._text || "";
    }

    /** Markiert die Zeile mit der Marke (oder keine, wenn `marke` leer ist). */
    markiere(marke) {
      const zeile = marke ? this.wurzel.querySelector(`[data-marke="${marke}"]`) : null;
      if (zeile === this.aktiveZeile) return;

      if (this.aktiveZeile) this.aktiveZeile.classList.remove("aktiv");
      this.aktiveZeile = zeile;
      if (zeile) {
        zeile.classList.add("aktiv");
        this._inSichtBringen(zeile);
      }
    }

    /** Scrollt nur den Code-Container, nie die ganze Seite. */
    _inSichtBringen(zeile) {
      const box = this.wurzel;
      const oben = zeile.offsetTop;
      const unten = oben + zeile.offsetHeight;
      if (oben < box.scrollTop || unten > box.scrollTop + box.clientHeight) {
        box.scrollTop = oben - box.clientHeight / 3;
      }
    }
  }

  /**
   * Verbindet einen (nur aus einem Icon bestehenden) Knopf damit, den aktuell
   * angezeigten Code in die Zwischenablage zu kopieren, mit kurzer
   * Rückmeldung als Icon und im Titel/aria-label.
   * @param {HTMLButtonElement} knopf
   * @param {function(): string} holeText liefert den zu kopierenden Text
   */
  function verbindeKopierKnopf(knopf, holeText) {
    const urspruenglichesIcon = knopf.textContent;
    const urspruenglicheBeschriftung = knopf.title;
    knopf.addEventListener("click", async () => {
      let erfolg = true;
      try {
        await navigator.clipboard.writeText(holeText());
      } catch {
        erfolg = false;
      }
      knopf.textContent = erfolg ? "✅" : "⚠️";
      const beschriftung = erfolg ? "Kopiert!" : "Kopieren fehlgeschlagen";
      knopf.title = beschriftung;
      knopf.setAttribute("aria-label", beschriftung);
      knopf.disabled = true;
      setTimeout(() => {
        knopf.textContent = urspruenglichesIcon;
        knopf.title = urspruenglicheBeschriftung;
        knopf.setAttribute("aria-label", urspruenglicheBeschriftung);
        knopf.disabled = false;
      }, 1500);
    });
  }

  TRACE.Codeansicht = Codeansicht;
  TRACE.verbindeKopierKnopf = verbindeKopierKnopf;
})(window.TRACE);
