/**
 * Player
 * ------
 * Steuert den Ablauf eines Algorithmus: Start/Pause, Tempo, Schritt vor/zurück.
 *
 * Der Player kennt weder Algorithmen noch Darstellung. Er bekommt eine
 * Generator-Funktion (die "Quelle"), holt sich daraus Schritt für Schritt die
 * Schritt-Objekte und merkt sich alle in einer Liste. Dadurch kann er jederzeit
 * zu einem früheren Schritt zurückspringen.
 *
 * Jeder angezeigte Schritt wird über den Callback `beiSchritt` gemeldet,
 * Änderungen am Zustand (läuft, Anfang, Ende) über `beiStatus`.
 */
window.TRACE = window.TRACE || {};

(function (TRACE) {
  "use strict";

  // Tempo-Stufe 1 bis 10 → Wartezeit zwischen zwei Takten und Schritte pro Takt.
  // Bei den schnellsten Stufen werden mehrere Schritte auf einmal ausgeführt,
  // weil Browser kürzere Wartezeiten als etwa 4 ms nicht zuverlässig schaffen.
  const TEMPO = {
    1: { pause: 1400, schritte: 1 },
    2: { pause: 900, schritte: 1 },
    3: { pause: 600, schritte: 1 },
    4: { pause: 380, schritte: 1 },
    5: { pause: 240, schritte: 1 },
    6: { pause: 140, schritte: 1 },
    7: { pause: 70, schritte: 1 },
    8: { pause: 30, schritte: 1 },
    9: { pause: 16, schritte: 4 },
    10: { pause: 16, schritte: 20 }
  };

  class Player {
    /**
     * @param {object}   rueckrufe
     * @param {function} rueckrufe.beiSchritt (schritt, index, vorheriger) → Schritt anzeigen
     * @param {function} rueckrufe.beiStatus  (status) → Knöpfe aktualisieren
     */
    constructor({ beiSchritt, beiStatus }) {
      this.beiSchritt = beiSchritt;
      this.beiStatus = beiStatus;

      this.quelle = null;      // laufender Generator
      this.schritte = [];      // alle bisher geholten Schritte
      this.index = 0;          // aktuell angezeigter Schritt
      this.erschoepft = false; // hat der Generator keine Schritte mehr?

      this.laeuft = false;
      this.tempo = 5;
      this.zeitgeber = null;
    }

    /** Lädt einen neuen Ablauf und zeigt dessen ersten Schritt. */
    laden(quelle) {
      this.pause();
      this.quelle = quelle;
      this.schritte = [];
      this.index = 0;
      this.erschoepft = false;
      this._sichereVorrat();
      this._melden();
    }

    /** true, wenn der letzte Schritt angezeigt wird. */
    get amEnde() {
      return this.erschoepft && this.index >= this.schritte.length - 1;
    }

    get amAnfang() {
      return this.index === 0;
    }

    start() {
      if (this.laeuft || this.schritte.length === 0) return;
      if (this.amEnde) this.index = 0; // Am Ende startet "Start" von vorn.
      this.laeuft = true;
      this._takt(); // ersten Schritt sofort zeigen, nicht erst nach der Pause
    }

    pause() {
      clearTimeout(this.zeitgeber);
      this.zeitgeber = null;
      if (this.laeuft) {
        this.laeuft = false;
        this._meldeStatus();
      }
    }

    umschalten() {
      if (this.laeuft) this.pause();
      else this.start();
    }

    /** Einen Schritt vor. Hält einen laufenden Ablauf an. */
    vor() {
      this.pause();
      if (this._schreite(1)) this._melden();
    }

    /** Einen Schritt zurück. Hält einen laufenden Ablauf an. */
    zurueck() {
      this.pause();
      if (this.index > 0) {
        this.index--;
        this._melden();
      }
    }

    /** Springt zum ersten Schritt, ohne den Ablauf neu zu berechnen. */
    zumAnfang() {
      this.pause();
      this.index = 0;
      this._melden();
    }

    /** @param {number} stufe 1 (langsam) bis 10 (schnell) */
    setzeTempo(stufe) {
      this.tempo = Math.min(10, Math.max(1, Math.round(stufe)));
      if (this.laeuft) {
        clearTimeout(this.zeitgeber);
        this._planeTakt();
      }
    }

    // ------------------------------------------------------------------
    // intern
    // ------------------------------------------------------------------

    _takt() {
      const weiter = this._schreite(TEMPO[this.tempo].schritte);
      this._melden();
      if (!weiter || this.amEnde) {
        this.pause();
      } else {
        this._planeTakt();
      }
    }

    _planeTakt() {
      this.zeitgeber = setTimeout(() => this._takt(), TEMPO[this.tempo].pause);
    }

    /**
     * Geht bis zu `anzahl` Schritte weiter, ohne anzuzeigen.
     * @returns {boolean} ob mindestens ein Schritt gemacht wurde
     */
    _schreite(anzahl) {
      let gemacht = 0;
      while (gemacht < anzahl) {
        this._sichereVorrat();
        if (this.index >= this.schritte.length - 1) break;
        this.index++;
        gemacht++;
      }
      this._sichereVorrat();
      return gemacht > 0;
    }

    /**
     * Sorgt dafür, dass nach dem aktuellen Schritt noch einer bereitliegt
     * (oder der Generator fertig ist). So weiß der Player immer, ob er am Ende ist.
     */
    _sichereVorrat() {
      while (!this.erschoepft && this.schritte.length <= this.index + 1) {
        const ergebnis = this.quelle.next();
        if (ergebnis.done) this.erschoepft = true;
        else this.schritte.push(ergebnis.value);
      }
    }

    _melden() {
      const schritt = this.schritte[this.index];
      if (schritt) {
        this.beiSchritt(schritt, this.index, this.schritte[this.index - 1] || null);
      }
      this._meldeStatus();
    }

    _meldeStatus() {
      this.beiStatus({
        laeuft: this.laeuft,
        index: this.index,
        amAnfang: this.amAnfang,
        amEnde: this.amEnde
      });
    }
  }

  TRACE.Player = Player;
})(window.TRACE);
