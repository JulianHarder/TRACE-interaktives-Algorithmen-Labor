/**
 * Balkenansicht
 * -------------
 * Zeichnet einen Sortier-Schritt als Balken auf ein Canvas.
 *
 * Die Ansicht rechnet nichts aus. Sie bekommt ein fertiges Schritt-Objekt und
 * zeichnet es: Werte als Balken, Farben nach dem einheitlichen Farbcode,
 * dazu Symbole (? ↔ ✓) und Zeiger (i, j, min), damit die Bedeutung nicht nur
 * an der Farbe hängt.
 */
window.TRACE = window.TRACE || {};
window.TRACE.sortieren = window.TRACE.sortieren || {};

(function (sortieren) {
  "use strict";

  const RAND = 8;          // Abstand links und rechts
  const KOPF = 40;         // Platz oben für Bereichs-Beschriftung und Symbole
  const ZAHLEN_HOEHE = 20; // Zeile unter den Balken für die Werte
  const ZEIGER_HOEHE = 30; // Zeile für die Zeiger i, j, min

  const SYMBOL = { vergleich: "?", tausch: "↔", fertig: "✓" };

  /** Liest den Farbcode aus den CSS-Variablen, damit hell/dunkel automatisch passt. */
  function leseFarben() {
    const stil = getComputedStyle(document.documentElement);
    const farbe = (name) => stil.getPropertyValue(name).trim();
    return {
      neutral: farbe("--neutral"),
      vergleich: farbe("--pruefen"),
      tausch: farbe("--aendern"),
      gemerkt: farbe("--bereich"),
      fertig: farbe("--fertig"),
      bereichFlaeche: farbe("--bereich-flaeche"),
      bereichText: farbe("--bereich"),
      text: farbe("--text"),
      textLeise: farbe("--text-leise"),
      schrift: getComputedStyle(document.body).fontFamily
    };
  }

  class Balkenansicht {
    /** @param {HTMLCanvasElement} leinwand */
    constructor(leinwand) {
      this.leinwand = leinwand;
      this.ctx = leinwand.getContext("2d");
      this.schritt = null;
      this.breite = 0;
      this.hoehe = 0;

      // Größe folgt dem Layout (auch beim ersten Einblenden des Bereichs).
      new ResizeObserver(() => this._passeGroesseAn()).observe(leinwand);
      // Hell/dunkel umgeschaltet → neu zeichnen mit den neuen Farben.
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => this.zeichne());
      // Reagiert zusätzlich auf den manuellen Hell/Dunkel-Knopf (js/ui/theme.js).
      window.addEventListener("trace:farbschema-geaendert", () => this.zeichne());
    }

    zeige(schritt) {
      this.schritt = schritt;
      this.zeichne();
    }

    _passeGroesseAn() {
      const rechteck = this.leinwand.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.breite = rechteck.width;
      this.hoehe = rechteck.height;
      this.dpr = dpr;
      this.leinwand.width = Math.round(rechteck.width * dpr);
      this.leinwand.height = Math.round(rechteck.height * dpr);
      this.zeichne();
    }

    zeichne() {
      const s = this.schritt;
      if (!s || !this.breite) return;

      const ctx = this.ctx;
      const f = leseFarben();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.breite, this.hoehe);

      const werte = s.werte;
      const n = werte.length;
      const spalte = (this.breite - 2 * RAND) / n;
      const luecke = Math.max(1, Math.min(8, spalte * 0.22));
      const balkenBreite = Math.max(1, spalte - luecke);
      const zeigeZahlen = spalte >= 18;

      const basis = this.hoehe - ZEIGER_HOEHE - (zeigeZahlen ? ZAHLEN_HOEHE : 4);
      const nutzhoehe = basis - KOPF;
      const groesster = Math.max(...werte, 1);
      const links = (i) => RAND + i * spalte;
      const mitte = (i) => links(i) + spalte / 2;

      // 1. Hinterlegter Bereich (z. B. "Suchbereich" oder "unsortierter Teil")
      if (s.bereich) this._zeichneBereich(s.bereich, links, spalte, basis, f);

      // 2. Balken mit Symbol darüber und Wert darunter
      const status = this._statusFunktion(s);
      const symbolGroesse = Math.max(10, Math.min(16, spalte * 0.6));

      for (let i = 0; i < n; i++) {
        const art = status(i);
        const hoehe = Math.max(2, (werte[i] / groesster) * nutzhoehe);
        const x = links(i) + luecke / 2;
        const y = basis - hoehe;

        ctx.fillStyle = f[art];
        this._rechteck(x, y, balkenBreite, hoehe, Math.min(4, balkenBreite / 3));

        const symbol = SYMBOL[art];
        if (symbol && (art !== "fertig" || spalte >= 14)) {
          ctx.fillStyle = art === "fertig" ? f.fertig : f.text;
          ctx.font = `700 ${symbolGroesse}px ${f.schrift}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(symbol, mitte(i), y - 6);
        }

        if (zeigeZahlen) {
          const betont = art === "vergleich" || art === "tausch";
          ctx.fillStyle = betont ? f.text : f.textLeise;
          ctx.font = `${betont ? 700 : 500} ${Math.min(13, spalte * 0.5)}px ${f.schrift}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(String(werte[i]), mitte(i), basis + 5);
        }
      }

      // 3. Zeiger (i, j, min) unter den Balken
      if (s.zeiger) {
        const zeigerOben = basis + (zeigeZahlen ? ZAHLEN_HOEHE : 4) + 2;
        this._zeichneZeiger(s.zeiger, mitte, zeigerOben, n, f);
      }
    }

    /** Liefert eine Funktion, die für jeden Index die Darstellungsart bestimmt. */
    _statusFunktion(s) {
      const aktiv = new Set(s.indizes || []);
      const gemerkt = new Set(s.gemerkt || []);
      const sortiert = new Set(s.sortiert || []);

      return (i) => {
        if (aktiv.has(i) && (s.typ === "vergleich" || s.typ === "tausch")) return s.typ;
        if (gemerkt.has(i)) return "gemerkt";
        if (sortiert.has(i)) return "fertig";
        return "neutral";
      };
    }

    _zeichneBereich(bereich, links, spalte, basis, f) {
      const ctx = this.ctx;
      const x0 = links(bereich.von);
      const x1 = links(bereich.bis) + spalte;
      ctx.fillStyle = f.bereichFlaeche;
      ctx.fillRect(x0, 0, x1 - x0, basis + 2);

      if (bereich.text) {
        ctx.font = `600 12px ${f.schrift}`;
        ctx.fillStyle = f.bereichText;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const textBreite = ctx.measureText(bereich.text).width;
        const x = Math.max(4, Math.min(x0 + 6, this.breite - textBreite - 4));
        ctx.fillText(bereich.text, x, 4);
      }
    }

    _zeichneZeiger(zeiger, mitte, oben, n, f) {
      const ctx = this.ctx;

      // Mehrere Zeiger auf demselben Index zusammenfassen: "i, min"
      const proIndex = new Map();
      for (const [name, index] of Object.entries(zeiger)) {
        if (index === undefined || index < 0 || index >= n) continue;
        if (!proIndex.has(index)) proIndex.set(index, []);
        proIndex.get(index).push(name);
      }

      ctx.fillStyle = f.text;
      ctx.font = `600 12px ${f.schrift}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (const [index, namen] of proIndex) {
        const x = mitte(index);
        ctx.beginPath();
        ctx.moveTo(x, oben);
        ctx.lineTo(x - 5, oben + 7);
        ctx.lineTo(x + 5, oben + 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillText(namen.join(", "), x, oben + 10);
      }
    }

    /** Balken mit oben abgerundeten Ecken. */
    _rechteck(x, y, breite, hoehe, radius) {
      const ctx = this.ctx;
      if (ctx.roundRect && radius > 0.5) {
        ctx.beginPath();
        ctx.roundRect(x, y, breite, hoehe, [radius, radius, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, breite, hoehe);
      }
    }
  }

  sortieren.Balkenansicht = Balkenansicht;
})(window.TRACE.sortieren);
