/**
 * Kästchenansicht
 * ---------------
 * Zeichnet einen Such-Schritt als Kästchen auf ein Canvas – jedes Kästchen
 * ein Wert, mit Position darunter. Der aktuelle Suchbereich wird blau
 * hinterlegt, das gerade geprüfte Kästchen gelb, ein Treffer grün.
 *
 * Anders als bei den Balken beim Sortieren ist hier die Zahl selbst das
 * einzige Signal – es gibt keine Balkenhöhe, die auch ohne Text noch etwas
 * zeigt. Deshalb werden die Kästchen nie schmaler als lesbar: Passen nicht
 * alle in eine Reihe, springen die restlichen in die nächste Reihe (wie bei
 * umbrechendem Text), statt seitlich wegzuscrollen. Die Zeichenfläche wächst
 * dafür in der Höhe; wird sie zu hoch, scrollt der Wrapper senkrecht.
 */
window.TRACE = window.TRACE || {};
window.TRACE.suchen = window.TRACE.suchen || {};

(function (suchen) {
  "use strict";

  const RAND = 8;
  const KOPF = 26;           // Platz oben für die Bereichs-Beschriftung
  const ZAHLEN_HOEHE = 20;   // Zeile unter den Kästchen für die Positionsnummer
  const ZEIGER_HOEHE = 22;   // Zeile darunter für Zeiger-Beschriftungen wie "mitte"
  const REIHEN_ABSTAND = 14; // Lücke zwischen zwei Reihen
  const MIN_SPALTE = 42;     // Kästchen werden nie schmaler als das – sonst lieber umbrechen

  function leseFarben() {
    const stil = getComputedStyle(document.documentElement);
    const farbe = (name) => stil.getPropertyValue(name).trim();
    return {
      neutral: farbe("--neutral"),
      pruefen: farbe("--pruefen"),
      fertig: farbe("--fertig"),
      bereichFlaeche: farbe("--bereich-flaeche"),
      bereichText: farbe("--bereich"),
      bereichRand: farbe("--bereich"),
      text: farbe("--text"),
      textAufFarbe: "#111318",
      textLeise: farbe("--text-leise"),
      schrift: getComputedStyle(document.body).fontFamily
    };
  }

  class Kaestchenansicht {
    /** @param {HTMLCanvasElement} leinwand liegt in einem (bei Bedarf senkrecht scrollbaren) Wrapper-Div */
    constructor(leinwand) {
      this.leinwand = leinwand;
      this.wrapper = leinwand.parentElement;
      this.ctx = leinwand.getContext("2d");
      this.schritt = null;
      this.layout = null; // siehe _layoutBerechnen
      this.dpr = window.devicePixelRatio || 1;

      // Reagiert auf die Breite des Wrappers, nicht der Leinwand selbst – sonst
      // würde jede von uns gesetzte Canvas-Höhe den Observer erneut auslösen.
      new ResizeObserver(() => this._aktualisiereGroesse()).observe(this.wrapper);
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => this.zeichne());
      // Reagiert zusätzlich auf den manuellen Hell/Dunkel-Knopf (js/ui/theme.js).
      window.addEventListener("trace:farbschema-geaendert", () => this.zeichne());
    }

    zeige(schritt) {
      this.schritt = schritt;
      this._aktualisiereGroesse();
    }

    /** Berechnet, wie viele Kästchen pro Reihe passen, und wie hoch das Canvas dafür sein muss. */
    _layoutBerechnen() {
      const n = this.schritt.werte.length;
      const verfuegbar = this.wrapper.clientWidth;
      const proReihe = Math.max(1, Math.min(n, Math.floor(verfuegbar / MIN_SPALTE)));
      const reihenAnzahl = Math.ceil(n / proReihe);

      const spalte = verfuegbar / proReihe;
      const luecke = Math.max(1, Math.min(6, spalte * 0.14));
      const kastenBreite = Math.max(1, spalte - luecke);
      const kastenHoehe = Math.max(30, Math.min(kastenBreite * 0.85, 58));
      const reihenHoehe = kastenHoehe + ZAHLEN_HOEHE + ZEIGER_HOEHE + REIHEN_ABSTAND;

      return {
        n, proReihe, spalte, luecke, kastenBreite, kastenHoehe,
        breite: verfuegbar,
        hoehe: KOPF + reihenAnzahl * reihenHoehe
      };
    }

    _aktualisiereGroesse() {
      if (!this.schritt) return;
      const layout = this._layoutBerechnen();

      if (!this.layout || layout.breite !== this.layout.breite || layout.hoehe !== this.layout.hoehe) {
        this.dpr = window.devicePixelRatio || 1;
        this.leinwand.style.width = layout.breite + "px";
        this.leinwand.style.height = layout.hoehe + "px";
        this.leinwand.width = Math.round(layout.breite * this.dpr);
        this.leinwand.height = Math.round(layout.hoehe * this.dpr);
      }
      this.layout = layout;
      this.zeichne();
    }

    /** @returns {{x:number, y:number, zeile:number}} linke obere Ecke des Kästchens für Index i */
    _position(i) {
      const l = this.layout;
      const zeile = Math.floor(i / l.proReihe);
      const spalteIndex = i % l.proReihe;
      const reihenHoehe = l.kastenHoehe + ZAHLEN_HOEHE + ZEIGER_HOEHE + REIHEN_ABSTAND;
      return {
        x: RAND + spalteIndex * l.spalte,
        y: KOPF + zeile * reihenHoehe,
        zeile
      };
    }

    zeichne() {
      const s = this.schritt;
      const l = this.layout;
      if (!s || !l) return;

      const ctx = this.ctx;
      const f = leseFarben();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, l.breite, l.hoehe);

      const werte = s.werte;
      const n = werte.length;
      const mitte = (i) => this._position(i).x + l.spalte / 2;

      if (s.bereich) this._zeichneBereich(s.bereich, f);

      const status = this._statusFunktion(s);

      for (let i = 0; i < n; i++) {
        const art = status(i);
        const pos = this._position(i);
        const x = pos.x + l.luecke / 2;

        ctx.fillStyle = f[art] || f.neutral;
        this._kaestchen(x, pos.y, l.kastenBreite, l.kastenHoehe, 5);

        ctx.fillStyle = art === "neutral" ? f.text : f.textAufFarbe;
        ctx.font = `700 ${Math.min(16, l.spalte * 0.4)}px ${f.schrift}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(werte[i]), mitte(i), pos.y + l.kastenHoehe / 2);

        ctx.fillStyle = f.textLeise;
        ctx.font = `500 11px ${f.schrift}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(String(i), mitte(i), pos.y + l.kastenHoehe + 6);
      }

      if (s.zeiger) this._zeichneZeiger(s.zeiger, f);

      this._haltAktivesKaestchenSichtbar(s);
    }

    _statusFunktion(s) {
      const aktiv = new Set(s.indizes || []);
      return (i) => {
        if ((s.typ === "gefunden" || s.typ === "fertig") && aktiv.has(i)) return "fertig";
        if (s.typ === "vergleich" && aktiv.has(i)) return "pruefen";
        return "neutral";
      };
    }

    /** Hinterlegt den Suchbereich – ein Rechteck pro Reihe, die der Bereich berührt. */
    _zeichneBereich(bereich, f) {
      const ctx = this.ctx;
      const l = this.layout;

      for (let zeile = Math.floor(bereich.von / l.proReihe); zeile <= Math.floor(bereich.bis / l.proReihe); zeile++) {
        const reihenVon = zeile * l.proReihe;
        const reihenBis = reihenVon + l.proReihe - 1;
        const von = Math.max(bereich.von, reihenVon);
        const bis = Math.min(bereich.bis, reihenBis);
        if (von > bis) continue;

        const x0 = this._position(von).x;
        const x1 = this._position(bis).x + l.spalte;
        const y = this._position(von).y;

        ctx.fillStyle = f.bereichFlaeche;
        ctx.fillRect(x0, y - 6, x1 - x0, l.kastenHoehe + 12);
        ctx.strokeStyle = f.bereichRand;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x0 + 0.75, y - 6 + 0.75, x1 - x0 - 1.5, l.kastenHoehe + 12 - 1.5);
      }

      if (bereich.text) {
        ctx.font = `600 12px ${f.schrift}`;
        ctx.fillStyle = f.bereichText;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(bereich.text, RAND, 4);
      }
    }

    _zeichneZeiger(zeiger, f) {
      const ctx = this.ctx;
      const l = this.layout;
      const proIndex = new Map();
      for (const [name, index] of Object.entries(zeiger)) {
        if (index === undefined || index < 0 || index >= l.n) continue;
        if (!proIndex.has(index)) proIndex.set(index, []);
        proIndex.get(index).push(name);
      }

      ctx.fillStyle = f.text;
      ctx.font = `600 12px ${f.schrift}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (const [index, namen] of proIndex) {
        const pos = this._position(index);
        const x = pos.x + l.spalte / 2;
        const oben = pos.y + l.kastenHoehe + ZAHLEN_HOEHE;
        ctx.beginPath();
        ctx.moveTo(x, oben);
        ctx.lineTo(x - 5, oben + 7);
        ctx.lineTo(x + 5, oben + 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillText(namen.join(", "), x, oben + 10);
      }
    }

    _kaestchen(x, y, breite, hoehe, radius) {
      const ctx = this.ctx;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, breite, hoehe, radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, breite, hoehe);
      }
    }

    /** Scrollt den Wrapper senkrecht nur, wenn die Reihe des aktiven Kästchens nicht sichtbar ist. */
    _haltAktivesKaestchenSichtbar(s) {
      const index = s.indizes && s.indizes.length ? s.indizes[0] : null;
      if (index === null) return;

      const l = this.layout;
      const box = this.wrapper;
      const pos = this._position(index);
      const y0 = pos.y - 6;
      const y1 = pos.y + l.kastenHoehe + ZAHLEN_HOEHE + ZEIGER_HOEHE;
      if (y0 < box.scrollTop || y1 > box.scrollTop + box.clientHeight) {
        box.scrollTop = Math.max(0, y0 - box.clientHeight / 2 + (y1 - y0) / 2);
      }
    }
  }

  suchen.Kaestchenansicht = Kaestchenansicht;
})(window.TRACE.suchen);
