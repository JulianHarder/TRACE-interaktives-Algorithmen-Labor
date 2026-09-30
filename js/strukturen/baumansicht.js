/**
 * Baumansicht
 * -----------
 * Zeichnet einen binären Suchbaum als Knoten-und-Kanten-Diagramm. Die
 * waagerechte Position jedes Knotens kommt aus einem Inorder-Durchlauf
 * (links, Knoten, rechts) – das ordnet die Werte automatisch von links nach
 * rechts aufsteigend an, genau wie es bei einem Suchbaum sein muss. Die
 * senkrechte Position ist die Tiefe im Baum.
 *
 * Anders als die Kästchen beim Suchen bricht der Baum bei vielen Knoten
 * NICHT um: Seine Form (welcher Knoten wo hängt) ist Teil der Aussage, ein
 * Zeilenumbruch würde sie zerstören. Wird er breiter als der Platz, scrollt
 * der Wrapper stattdessen waagerecht – mit automatischem Mitscrollen zum
 * gerade betrachteten Knoten.
 */
window.TRACE = window.TRACE || {};
window.TRACE.strukturen = window.TRACE.strukturen || {};

(function (strukturen) {
  "use strict";

  const RAND = 30;
  const SPALTEN_BREITE = 50;
  const ZEILEN_HOEHE = 64;
  const RADIUS = 20;

  function leseFarben() {
    const stil = getComputedStyle(document.documentElement);
    const farbe = (name) => stil.getPropertyValue(name).trim();
    return {
      neutral: farbe("--neutral"),
      pruefen: farbe("--pruefen"),
      aendern: farbe("--aendern"),
      bereich: farbe("--bereich"),
      fertig: farbe("--fertig"),
      kante: farbe("--rand"),
      text: farbe("--text"),
      textAufFarbe: "#111318",
      schrift: getComputedStyle(document.body).fontFamily
    };
  }

  /** Inorder-Durchlauf: liefert Knotenpositionen (x = Rang, y = Tiefe) und die Kantenliste. */
  function sammleKnotenUndKanten(wurzel) {
    const knoten = [];
    const kanten = [];
    let rang = 0;
    let maxTiefe = 0;

    function traversiere(n, tiefe, elternWert) {
      if (!n) return;
      traversiere(n.links, tiefe + 1, n.wert);
      knoten.push({ wert: n.wert, x: rang++, y: tiefe });
      maxTiefe = Math.max(maxTiefe, tiefe);
      if (elternWert !== null) kanten.push({ von: elternWert, nach: n.wert });
      traversiere(n.rechts, tiefe + 1, n.wert);
    }
    traversiere(wurzel, 0, null);
    return { knoten, kanten, anzahl: rang, maxTiefe };
  }

  class Baumansicht {
    /** @param {HTMLCanvasElement} leinwand liegt in einem waagerecht scrollbaren Wrapper-Div */
    constructor(leinwand) {
      this.leinwand = leinwand;
      this.wrapper = leinwand.parentElement;
      this.ctx = leinwand.getContext("2d");
      this.schritt = null;
      this.dpr = window.devicePixelRatio || 1;
      this.breite = 0;
      this.hoehe = 0;

      new ResizeObserver(() => this._aktualisiereGroesse()).observe(this.wrapper);
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.zeichne());
      // Reagiert zusätzlich auf den manuellen Hell/Dunkel-Knopf (js/ui/theme.js).
      window.addEventListener("trace:farbschema-geaendert", () => this.zeichne());
    }

    /** @param {{baum: object|null, pfad: number[], letzterTyp: string}} schritt */
    zeige(schritt) {
      this.schritt = schritt;
      this._aktualisiereGroesse();
    }

    _aktualisiereGroesse() {
      const daten = this._daten();
      const verfuegbar = this.wrapper.clientWidth;
      const noetig = Math.max(verfuegbar, daten.anzahl * SPALTEN_BREITE + 2 * RAND);
      const hoehe = (daten.maxTiefe + 1) * ZEILEN_HOEHE + 2 * RAND;

      if (Math.round(noetig) !== this.breite || Math.round(hoehe) !== this.hoehe) {
        this.breite = Math.round(noetig);
        this.hoehe = Math.round(hoehe);
        this.dpr = window.devicePixelRatio || 1;
        this.leinwand.style.width = this.breite + "px";
        this.leinwand.style.height = this.hoehe + "px";
        this.leinwand.width = Math.round(this.breite * this.dpr);
        this.leinwand.height = Math.round(this.hoehe * this.dpr);
      }
      this.zeichne();
    }

    _daten() {
      return this.schritt && this.schritt.baum
        ? sammleKnotenUndKanten(this.schritt.baum)
        : { knoten: [], kanten: [], anzahl: 0, maxTiefe: 0 };
    }

    _pixel(x, y) {
      return { x: RAND + x * SPALTEN_BREITE, y: RAND + y * ZEILEN_HOEHE };
    }

    zeichne() {
      if (!this.breite) return;
      const ctx = this.ctx;
      const f = leseFarben();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.breite, this.hoehe);

      const { knoten, kanten } = this._daten();
      if (knoten.length === 0) {
        ctx.fillStyle = f.text;
        ctx.font = `500 14px ${f.schrift}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("(leerer Baum)", RAND, RAND);
        return;
      }

      const positionVon = new Map(knoten.map((k) => [k.wert, this._pixel(k.x, k.y)]));

      ctx.strokeStyle = f.kante;
      ctx.lineWidth = 2;
      for (const kante of kanten) {
        const von = positionVon.get(kante.von);
        const nach = positionVon.get(kante.nach);
        ctx.beginPath();
        ctx.moveTo(von.x, von.y);
        ctx.lineTo(nach.x, nach.y);
        ctx.stroke();
      }

      const pfad = (this.schritt && this.schritt.pfad) || [];
      const aktuellerWert = pfad.length ? pfad[pfad.length - 1] : null;

      for (const k of knoten) {
        const pos = this._pixel(k.x, k.y);
        const istAktuell = k.wert === aktuellerWert;
        const aufPfad = pfad.includes(k.wert);

        let farbe = f.neutral;
        if (istAktuell) {
          farbe = this.schritt.hervorhebung === "einfuegen" ? f.aendern
            : this.schritt.hervorhebung === "gefunden" ? f.fertig
            : f.pruefen;
        } else if (aufPfad) {
          farbe = f.bereich;
        }

        ctx.fillStyle = farbe;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = farbe === f.neutral ? f.text : f.textAufFarbe;
        ctx.font = `700 ${Math.min(15, RADIUS)}px ${f.schrift}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(k.wert), pos.x, pos.y + 1);
      }

      this._haltAktuellenKnotenSichtbar(positionVon.get(aktuellerWert));
    }

    _haltAktuellenKnotenSichtbar(pos) {
      if (!pos) return;
      const box = this.wrapper;
      const x0 = pos.x - RADIUS - 10;
      const x1 = pos.x + RADIUS + 10;
      if (x0 < box.scrollLeft || x1 > box.scrollLeft + box.clientWidth) {
        box.scrollLeft = Math.max(0, pos.x - box.clientWidth / 2);
      }
    }
  }

  strukturen.Baumansicht = Baumansicht;
})(window.TRACE.strukturen);
