/**
 * Suchen-Bereich
 * --------------
 * Verbindet Algorithmen, Player und Darstellung für den Bereich "Suchen".
 * Aufbau bewusst sehr ähnlich zu sortieren/bereich.js – gleiches Grundmuster,
 * nur ohne "Vertauschungen"-Zähler und mit einem Zielwert statt einer reinen
 * Zufallsanordnung.
 *
 * Ein Such-Algorithmus ist ein Objekt mit id, name, info, code und einer
 * Generator-Funktion `suche(a, ziel)`. Er verändert `a` nicht und beschreibt
 * mit `yield` jeden Schritt, siehe suchen/linear.js und suchen/binaer.js.
 *
 * Besonderheit: `info.brauchtSortierung` markiert Algorithmen, die nur bei
 * aufsteigend sortierten Werten korrekt arbeiten (binäre Suche). Für die
 * Anzeige und Suche wird dann automatisch eine sortierte Kopie der Werte
 * verwendet – die Reihenfolge, in der die Zahlen eingegeben/erzeugt wurden,
 * bleibt für die lineare Suche trotzdem erhalten.
 */
window.TRACE = window.TRACE || {};
window.TRACE.suchen = window.TRACE.suchen || {};

(function (TRACE, suchen) {
  "use strict";

  const algorithmen = [];

  function registriere(algorithmus) {
    algorithmen.push(algorithmus);
  }

  /** Zufallszahlen zwischen 5 und 99, ohne Duplikate (leichter als Ziel zu merken). */
  function zufallszahlen(anzahl) {
    const vorrat = [];
    for (let n = 5; n < 100; n++) vorrat.push(n);
    for (let i = vorrat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vorrat[i], vorrat[j]] = [vorrat[j], vorrat[i]];
    }
    return vorrat.slice(0, Math.min(anzahl, vorrat.length));
  }

  /** Eine Zahl, die garantiert nicht in `werte` vorkommt. */
  function zahlAusserhalb(werte) {
    return Math.max(...werte, 0) + 1;
  }

  /**
   * Lässt den Algorithmus über einer (bei Bedarf sortierten) Kopie der Werte
   * laufen und ergänzt jeden Schritt um eine Momentaufnahme.
   */
  function* protokolliere(algorithmus, werteRoh, ziel) {
    const werte = algorithmus.info.brauchtSortierung ? werteRoh.slice().sort((a, b) => a - b) : werteRoh.slice();
    const n = werte.length;
    let vergleiche = 0;
    let letzteVariablen = {};
    let gefundenIndex = null;

    yield {
      typ: "start",
      zeile: null,
      variablen: {},
      text: `Suche die Zahl ${ziel} in ${n} Werten.`,
      werte: werte.slice(),
      bereich: null,
      indizes: [],
      vergleiche
    };

    for (const schritt of algorithmus.suche(werte, ziel)) {
      if (schritt.typ === "vergleich") vergleiche++;
      if (schritt.typ === "gefunden") gefundenIndex = schritt.indizes[0];
      letzteVariablen = schritt.variablen || letzteVariablen;

      yield { ...schritt, werte: werte.slice(), vergleiche };
    }

    yield {
      typ: "fertig",
      zeile: gefundenIndex !== null ? "gefunden" : "ende",
      variablen: letzteVariablen,
      text: gefundenIndex !== null
        ? `Fertig! ${ziel} steht an Position ${gefundenIndex} – gefunden nach ${vergleiche} Vergleichen.`
        : `Fertig! ${ziel} kommt in den ${n} Zahlen nicht vor – nach ${vergleiche} Vergleichen war der Suchbereich leer.`,
      werte: werte.slice(),
      indizes: gefundenIndex !== null ? [gefundenIndex] : [],
      vergleiche
    };
  }

  // ----------------------------------------------------------------------
  // Bereich mit Bedienung
  // ----------------------------------------------------------------------

  class SuchenBereich {
    /** @param {HTMLElement} wurzel die <section> des Bereichs */
    constructor(wurzel) {
      const finde = (id) => wurzel.querySelector("#" + id);
      this.el = {
        auswahl: finde("suche-auswahl"),
        anzahl: finde("suche-anzahl"),
        anzahlWert: finde("suche-anzahl-wert"),
        mischen: finde("suche-mischen"),
        ziel: finde("suche-ziel"),
        zielEnthalten: finde("suche-ziel-enthalten"),
        zielFehlt: finde("suche-ziel-fehlt"),
        sortierHinweis: finde("suche-sortier-hinweis"),
        sprache: finde("suche-sprache"),
        kopieren: finde("suche-kopieren"),
        info: finde("suche-info"),
        erklaerung: finde("suche-erklaerung"),
        start: finde("suche-start"),
        vor: finde("suche-vor"),
        zurueck: finde("suche-zurueck"),
        zuruecksetzen: finde("suche-zuruecksetzen"),
        tempo: finde("suche-tempo"),
        vergleiche: finde("suche-vergleiche"),
        schritte: finde("suche-schritte")
      };

      this.ansicht = new suchen.Kaestchenansicht(finde("suche-leinwand"));
      this.code = new TRACE.Codeansicht(finde("suche-code"));
      TRACE.verbindeKopierKnopf(this.el.kopieren, () => this.code.holeText());
      this.schreibtisch = new TRACE.Schreibtisch(finde("suche-schreibtisch"));
      this.player = new TRACE.Player({
        beiSchritt: (schritt, index, vorheriger) => this._zeigeSchritt(schritt, index, vorheriger),
        beiStatus: (status) => this._zeigeStatus(status)
      });
      this.player.setzeTempo(Number(this.el.tempo.value));

      this.algorithmus = algorithmen[0];
      this.sprache = "pseudocode";
      this._letzteZeile = null;
      this.werteRoh = zufallszahlen(Number(this.el.anzahl.value));
      this.ziel = this.werteRoh[Math.floor(Math.random() * this.werteRoh.length)];
      this.el.ziel.value = this.ziel;

      this._baueAuswahl();
      this._verbindeBedienung();
      this._waehle(this.algorithmus);
    }

    anhalten() {
      this.player.pause();
    }

    /** Neue Zufallszahlen und ein neues (enthaltenes) Ziel, Algorithmus startet von vorn. */
    mischen() {
      this.werteRoh = zufallszahlen(Number(this.el.anzahl.value));
      this.ziel = this.werteRoh[Math.floor(Math.random() * this.werteRoh.length)];
      this.el.ziel.value = this.ziel;
      this._neuLaden();
    }

    /**
     * Tastatur: Leertaste, Pfeil links/rechts, R.
     * @returns {boolean} true, wenn die Taste verarbeitet wurde
     */
    taste(ereignis) {
      const ziel = ereignis.target;
      const istRegler = ziel instanceof HTMLInputElement && ziel.type === "range";

      switch (ereignis.key) {
        case " ":
          this.player.umschalten();
          return true;
        case "ArrowRight":
          if (istRegler) return false;
          this.player.vor();
          return true;
        case "ArrowLeft":
          if (istRegler) return false;
          this.player.zurueck();
          return true;
        case "r":
        case "R":
          this.mischen();
          return true;
        default:
          return false;
      }
    }

    // ------------------------------------------------------------------
    // intern
    // ------------------------------------------------------------------

    _baueAuswahl() {
      for (const algorithmus of algorithmen) {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.textContent = algorithmus.name;
        knopf.dataset.id = algorithmus.id;
        knopf.addEventListener("click", () => this._waehle(algorithmus));
        this.el.auswahl.append(knopf);
      }
    }

    _verbindeBedienung() {
      const el = this.el;
      el.start.addEventListener("click", () => this.player.umschalten());
      el.vor.addEventListener("click", () => this.player.vor());
      el.zurueck.addEventListener("click", () => this.player.zurueck());
      el.zuruecksetzen.addEventListener("click", () => this.player.zumAnfang());
      el.mischen.addEventListener("click", () => this.mischen());
      el.tempo.addEventListener("input", () => this.player.setzeTempo(Number(el.tempo.value)));
      el.anzahl.addEventListener("input", () => {
        el.anzahlWert.textContent = el.anzahl.value;
        this.mischen();
      });

      const suchtMitEingabe = () => {
        const zahl = Number(el.ziel.value);
        if (!Number.isFinite(zahl)) return;
        this.ziel = Math.round(zahl);
        this._neuLaden();
      };
      el.ziel.addEventListener("change", suchtMitEingabe);
      el.ziel.addEventListener("keydown", (ereignis) => {
        if (ereignis.key === "Enter") {
          ereignis.preventDefault();
          suchtMitEingabe();
        }
      });

      el.zielEnthalten.addEventListener("click", () => {
        this.ziel = this.werteRoh[Math.floor(Math.random() * this.werteRoh.length)];
        el.ziel.value = this.ziel;
        this._neuLaden();
      });
      el.zielFehlt.addEventListener("click", () => {
        this.ziel = zahlAusserhalb(this.werteRoh);
        el.ziel.value = this.ziel;
        this._neuLaden();
      });

      for (const knopf of el.sprache.children) {
        knopf.addEventListener("click", () => {
          if (knopf.dataset.sprache === this.sprache) return;
          this.sprache = knopf.dataset.sprache;
          for (const k of el.sprache.children) k.setAttribute("aria-pressed", String(k === knopf));
          this.code.setzeCode(this.algorithmus.code[this.sprache]);
          this.code.markiere(this._letzteZeile);
        });
      }
    }

    _waehle(algorithmus) {
      this.algorithmus = algorithmus;
      for (const knopf of this.el.auswahl.children) {
        knopf.setAttribute("aria-pressed", String(knopf.dataset.id === algorithmus.id));
      }
      this.code.setzeCode(algorithmus.code[this.sprache]);
      this._zeigeInfo(algorithmus);
      this.el.sortierHinweis.hidden = !algorithmus.info.brauchtSortierung;
      this._neuLaden();
    }

    _neuLaden() {
      this.schreibtisch.neuBeginnen();
      this.player.laden(protokolliere(this.algorithmus, this.werteRoh, this.ziel));
    }

    _zeigeInfo(algorithmus) {
      const info = algorithmus.info;
      const absatz = document.createElement("p");
      const name = document.createElement("strong");
      name.textContent = algorithmus.name;
      absatz.append(name, " – " + info.beschreibung);

      const kennzahlen = document.createElement("ul");
      kennzahlen.className = "kennzahlen";
      const eintraege = [
        ["Ø", info.schnitt, "Laufzeit im Durchschnitt"],
        ["schlimmster Fall", info.schlimmster, "Laufzeit im schlimmsten Fall"],
        ["bester Fall", info.bester, "Laufzeit im besten Fall"],
        ["Speicher", info.speicher, "zusätzlicher Speicherbedarf"],
        ["braucht sortierte Daten", info.brauchtSortierung ? "ja" : "nein", "Funktioniert das Verfahren auch bei unsortierten Werten?"]
      ];
      for (const [bezeichnung, wert, erklaerung] of eintraege) {
        const li = document.createElement("li");
        li.title = erklaerung;
        const b = document.createElement("b");
        b.textContent = wert;
        li.append(bezeichnung + " ", b);
        kennzahlen.append(li);
      }

      const einsatz = document.createElement("p");
      einsatz.className = "einsatz";
      einsatz.textContent = "Einsatz: " + info.einsatz;

      this.el.info.replaceChildren(absatz, kennzahlen, einsatz);
    }

    _zeigeSchritt(schritt, index, vorheriger) {
      this._letzteZeile = schritt.zeile;
      this.ansicht.zeige(schritt);
      this.code.markiere(schritt.zeile);
      this.schreibtisch.zeige(this.player.schritte, index);
      this.el.erklaerung.textContent = schritt.text;
      this.el.vergleiche.textContent = schritt.vergleiche;
      this.el.schritte.textContent = index;
    }

    _zeigeStatus(status) {
      const el = this.el;
      if (status.laeuft) el.start.textContent = "❚❚ Pause";
      else if (status.amEnde) el.start.textContent = "▶ Von vorn";
      else el.start.textContent = "▶ Start";

      el.zurueck.disabled = status.amAnfang;
      el.vor.disabled = status.amEnde;
      el.zuruecksetzen.disabled = status.amAnfang && !status.laeuft;
    }
  }

  Object.assign(suchen, { registriere, algorithmen, SuchenBereich });
})(window.TRACE, window.TRACE.suchen);
