/**
 * Gitteransicht
 * -------------
 * Zeichnet das Gitter für die Wegfindung UND verwaltet es: Mit der Maus (oder
 * dem Finger) Gelände zeichnen, Start (S) und Ziel (Z) verschieben. Anders als
 * bei Sortieren und Suchen liegen die Nutzdaten (Gelände, Start, Ziel) hier
 * direkt in dieser Ansicht, weil man sie mit der Maus bearbeitet statt sie
 * per Regler einzustellen.
 *
 * Jedes Feld hat eine von drei Geländearten: "leer" (Kosten 1), "wand"
 * (nicht begehbar) oder "sumpf" (Kosten SUMPF_KOSTEN – teurer als normaler
 * Boden). Welche Art gerade mit der Maus gezeichnet wird, bestimmt
 * `werkzeug`. Erst der Sumpf macht sichtbar, was Dijkstra und A* von der
 * Breitensuche unterscheidet: Auf einem Gitter, auf dem jedes Feld gleich
 * viel kostet, liefern alle drei denselben kürzesten Weg.
 *
 * Über den `aendern`-Rückruf meldet sie jede Bearbeitung an den Bereich, der
 * daraufhin die Suche auf dem neuen Gitter von vorne startet.
 *
 * Die Gittergröße ist fest (18 × 12 Felder) und passt sich nur in der
 * Kästchengröße an den verfügbaren Platz an – das hält die Bedienung
 * gleich, egal ob am großen Bildschirm oder auf dem Handy.
 */
window.TRACE = window.TRACE || {};
window.TRACE.wegfindung = window.TRACE.wegfindung || {};

(function (wegfindung) {
  "use strict";

  const SPALTEN = 18;
  const ZEILEN = 12;
  const MIN_ZELLE = 12; // reine Sicherheitsgrenze gegen extrem schmale Container
  const SUMPF_KOSTEN = 5;

  function leseFarben() {
    const stil = getComputedStyle(document.documentElement);
    const farbe = (name) => stil.getPropertyValue(name).trim();
    return {
      neutral: farbe("--flaeche-2"),
      pruefen: farbe("--pruefen"),
      aendern: farbe("--aendern"),
      bereich: farbe("--bereich"),
      fertig: farbe("--fertig"),
      wand: farbe("--text-leise"),
      sumpf: farbe("--sumpf"),
      gitterlinie: farbe("--rand"),
      markierung: farbe("--text"),
      markierungText: farbe("--hintergrund"),
      schrift: getComputedStyle(document.body).fontFamily
    };
  }

  class Gitteransicht {
    /**
     * @param {HTMLCanvasElement} leinwand liegt in einem Wrapper-Div
     * @param {function} aendern wird nach jeder Bearbeitung aufgerufen
     */
    constructor(leinwand, aendern) {
      this.leinwand = leinwand;
      this.wrapper = leinwand.parentElement;
      this.ctx = leinwand.getContext("2d");
      this.aendern = aendern || (() => {});

      this.spalten = SPALTEN;
      this.zeilen = ZEILEN;
      this.gelaende = this._leeresGitter();
      this.werkzeug = "wand"; // "wand" | "sumpf" – was beim Zeichnen gerade gesetzt wird
      this.start = { zeile: Math.floor(ZEILEN / 2), spalte: 2 };
      this.ziel = { zeile: Math.floor(ZEILEN / 2), spalte: SPALTEN - 3 };

      this.schritt = null; // aktueller Algorithmus-Schritt, als Überlagerung gezeichnet
      this.zellGroesse = MIN_ZELLE;
      this.breite = 0;
      this.hoehe = 0;
      this.dpr = window.devicePixelRatio || 1;

      this._ziehModus = null; // "setzen" | "loeschen" | "start" | "ziel"

      new ResizeObserver(() => this._aktualisiereGroesse()).observe(this.wrapper);
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.zeichne());
      // Reagiert zusätzlich auf den manuellen Hell/Dunkel-Knopf (js/ui/theme.js).
      window.addEventListener("trace:farbschema-geaendert", () => this.zeichne());
      this._verbindeBedienung();
    }

    _leeresGitter() {
      return Array.from({ length: this.zeilen }, () => new Array(this.spalten).fill("leer"));
    }

    /** Setzt das Gelände zurück (keine Wände, kein Sumpf mehr), Start und Ziel bleiben, wo sie sind. */
    leeren() {
      this.gelaende = this._leeresGitter();
      this.zeichne();
      this.aendern();
    }

    /** Wechselt, was beim Zeichnen mit der Maus/dem Finger gesetzt wird. */
    setzeWerkzeug(werkzeug) {
      this.werkzeug = werkzeug;
    }

    /** Bestreut das Gitter mit zufälligen Wänden und etwas Sumpf (Start und Ziel bleiben frei). */
    zufallsGelaende(wandDichte = 0.26, sumpfDichte = 0.14) {
      const gelaende = this._leeresGitter();
      for (let z = 0; z < this.zeilen; z++) {
        for (let s = 0; s < this.spalten; s++) {
          if (this._istStartOderZiel(z, s)) continue;
          const zufall = Math.random();
          if (zufall < wandDichte) gelaende[z][s] = "wand";
          else if (zufall < wandDichte + sumpfDichte) gelaende[z][s] = "sumpf";
        }
      }
      this.gelaende = gelaende;
      this.zeichne();
      this.aendern();
    }

    /** Zeigt einen Algorithmus-Schritt als Überlagerung (besuchte Felder, aktuelles Feld, Weg …). */
    zeige(schritt) {
      this.schritt = schritt;
      this.zeichne();
    }

    _istStartOderZiel(zeile, spalte) {
      return (zeile === this.start.zeile && spalte === this.start.spalte) ||
        (zeile === this.ziel.zeile && spalte === this.ziel.spalte);
    }

    // ------------------------------------------------------------------
    // Größe
    // ------------------------------------------------------------------

    _aktualisiereGroesse() {
      const verfuegbar = this.wrapper.clientWidth;
      const zellGroesse = Math.max(MIN_ZELLE, verfuegbar / this.spalten);
      const breite = zellGroesse * this.spalten;
      const hoehe = zellGroesse * this.zeilen;

      if (Math.round(breite) !== this.breite) {
        this.zellGroesse = zellGroesse;
        this.breite = Math.round(breite);
        this.hoehe = Math.round(hoehe);
        this.dpr = window.devicePixelRatio || 1;
        this.leinwand.style.width = this.breite + "px";
        this.leinwand.style.height = this.hoehe + "px";
        this.leinwand.width = Math.round(this.breite * this.dpr);
        this.leinwand.height = Math.round(this.hoehe * this.dpr);
      }
      this.zeichne();
    }

    // ------------------------------------------------------------------
    // Zeichnen
    // ------------------------------------------------------------------

    zeichne() {
      if (!this.breite) return;
      const ctx = this.ctx;
      const f = leseFarben();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Gitterlinien: Hintergrund einmal komplett füllen, Felder um 1px verkleinert
      // zeichnen – die 1px-Lücke wird so automatisch zur Trennlinie.
      ctx.fillStyle = f.gitterlinie;
      ctx.fillRect(0, 0, this.breite, this.hoehe);

      const g = this.zellGroesse;
      const s = this.schritt;
      const besucht = new Set(s ? s.besucht : []);
      const weg = new Set(s && s.weg ? s.weg.map((z) => this._schluessel(z)) : []);
      const aktuell = s && s.typ === "besuchen" ? s.zelle : null;
      const entdeckt = s && s.typ === "entdecken" ? s.zelle : null;

      for (let zeile = 0; zeile < this.zeilen; zeile++) {
        for (let spalte = 0; spalte < this.spalten; spalte++) {
          const schluessel = `${zeile},${spalte}`;
          const art = this.gelaende[zeile][spalte];
          let farbe = art === "sumpf" ? f.sumpf : f.neutral;

          if (art === "wand") farbe = f.wand;
          else if (weg.has(schluessel)) farbe = f.fertig;
          else if (aktuell && aktuell.zeile === zeile && aktuell.spalte === spalte) farbe = f.pruefen;
          else if (entdeckt && entdeckt.zeile === zeile && entdeckt.spalte === spalte) farbe = f.aendern;
          else if (besucht.has(schluessel)) farbe = f.bereich;

          ctx.fillStyle = farbe;
          ctx.fillRect(spalte * g + 1, zeile * g + 1, g - 2, g - 2);
        }
      }

      this._zeichneMarkierung(this.start, "S", f);
      this._zeichneMarkierung(this.ziel, "Z", f);
    }

    _zeichneMarkierung(zelle, buchstabe, f) {
      const g = this.zellGroesse;
      const x = zelle.spalte * g + g / 2;
      const y = zelle.zeile * g + g / 2;
      const ctx = this.ctx;

      ctx.fillStyle = f.markierung;
      ctx.beginPath();
      ctx.arc(x, y, g * 0.36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = f.markierungText;
      ctx.font = `700 ${Math.max(10, Math.round(g * 0.42))}px ${f.schrift}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(buchstabe, x, y + 1);
    }

    _schluessel(z) {
      return `${z.zeile},${z.spalte}`;
    }

    // ------------------------------------------------------------------
    // Maus- und Touch-Bedienung
    // ------------------------------------------------------------------

    _zelleAusEreignis(ereignis) {
      const rechteck = this.leinwand.getBoundingClientRect();
      const punkt = ereignis.touches && ereignis.touches[0] ? ereignis.touches[0] : ereignis;
      const x = punkt.clientX - rechteck.left;
      const y = punkt.clientY - rechteck.top;
      const spalte = Math.floor(x / this.zellGroesse);
      const zeile = Math.floor(y / this.zellGroesse);
      if (zeile < 0 || zeile >= this.zeilen || spalte < 0 || spalte >= this.spalten) return null;
      return { zeile, spalte };
    }

    _verbindeBedienung() {
      const beginne = (ereignis) => {
        const zelle = this._zelleAusEreignis(ereignis);
        if (!zelle) return;
        ereignis.preventDefault();

        if (zelle.zeile === this.start.zeile && zelle.spalte === this.start.spalte) {
          this._ziehModus = "start";
        } else if (zelle.zeile === this.ziel.zeile && zelle.spalte === this.ziel.spalte) {
          this._ziehModus = "ziel";
        } else {
          const bisherigeArt = this.gelaende[zelle.zeile][zelle.spalte];
          this._ziehModus = bisherigeArt === this.werkzeug ? "loeschen" : "setzen";
          this._bearbeiteZelle(zelle);
        }
      };

      const bewege = (ereignis) => {
        if (!this._ziehModus) return;
        const zelle = this._zelleAusEreignis(ereignis);
        if (!zelle) return;
        ereignis.preventDefault();
        this._bearbeiteZelle(zelle);
      };

      const beende = () => {
        this._ziehModus = null;
      };

      this.leinwand.addEventListener("mousedown", beginne);
      this.leinwand.addEventListener("mousemove", bewege);
      window.addEventListener("mouseup", beende);

      this.leinwand.addEventListener("touchstart", beginne, { passive: false });
      this.leinwand.addEventListener("touchmove", bewege, { passive: false });
      window.addEventListener("touchend", beende);
      window.addEventListener("touchcancel", beende);
    }

    _bearbeiteZelle(zelle) {
      if (this._ziehModus === "start" || this._ziehModus === "ziel") {
        if (this.gelaende[zelle.zeile][zelle.spalte] === "wand") return; // keine Wand als Start/Ziel
        if (this._istStartOderZiel(zelle.zeile, zelle.spalte)) return; // schon dort, oder das jeweils andere
        if (this._ziehModus === "start") this.start = zelle;
        else this.ziel = zelle;
        this.zeichne();
        this.aendern();
        return;
      }

      if (this._istStartOderZiel(zelle.zeile, zelle.spalte)) return;
      const neueArt = this._ziehModus === "setzen" ? this.werkzeug : "leer";
      if (this.gelaende[zelle.zeile][zelle.spalte] === neueArt) return;
      this.gelaende[zelle.zeile][zelle.spalte] = neueArt;
      this.zeichne();
      this.aendern();
    }
  }

  wegfindung.Gitteransicht = Gitteransicht;
  wegfindung.SUMPF_KOSTEN = SUMPF_KOSTEN;
})(window.TRACE.wegfindung);
