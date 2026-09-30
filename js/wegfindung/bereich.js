/**
 * Wegfindung-Bereich
 * ------------------
 * Verbindet Algorithmen, Player, Gitter und Darstellung für den Bereich
 * "Wegfindung". Gleicher Grundaufbau wie sortieren/bereich.js und
 * suchen/bereich.js, aber:
 *  - die Nutzdaten (Wände, Start, Ziel) liegen in der Gitteransicht selbst,
 *    weil man sie mit der Maus bearbeitet (siehe gitter.js)
 *  - es gibt keinen "Anzahl"-Regler, dafür "Wände löschen" und "Zufällige Wände"
 *  - Zähler sind "besuchte Felder" und "Weglänge" statt Vergleiche/Vertauschungen
 *
 * Ein Wegfindungs-Algorithmus ist ein Objekt mit id, name, info, code und
 * einer Generator-Funktion `suche(kontext, start, ziel)`. `kontext` ist
 * { wand, zeilen, spalten }. Er verändert nichts, sondern beschreibt mit
 * `yield` jeden Schritt:
 *
 *   { typ: "besuchen", zelle: {zeile, spalte}, zeile: "entnehmen", variablen, text }
 *   { typ: "entdecken", zelle: {zeile, spalte}, zeile: "entdecken", variablen, text }
 *   { typ: "weg", zellen: [{zeile,spalte}, …], zeile: "gefunden", variablen, text }
 *
 * "besuchen" heißt: dieses Feld wird gerade aus der Warteschlange geholt und
 * untersucht. "entdecken" heißt: ein Nachbarfeld ist neu und begehbar und
 * wird in die Warteschlange gelegt – ab hier gilt es als "besucht" (blau),
 * damit es nicht doppelt eingereiht wird.
 */
window.TRACE = window.TRACE || {};
window.TRACE.wegfindung = window.TRACE.wegfindung || {};

(function (TRACE, wegfindung) {
  "use strict";

  const algorithmen = [];

  function registriere(algorithmus) {
    algorithmen.push(algorithmus);
  }

  function schluessel(zelle) {
    return `${zelle.zeile},${zelle.spalte}`;
  }

  /** Die bis zu vier begehbaren Nachbarfelder (oben, rechts, unten, links). */
  function nachbarn(kontext, zelle) {
    const kandidaten = [
      { zeile: zelle.zeile - 1, spalte: zelle.spalte },
      { zeile: zelle.zeile, spalte: zelle.spalte + 1 },
      { zeile: zelle.zeile + 1, spalte: zelle.spalte },
      { zeile: zelle.zeile, spalte: zelle.spalte - 1 }
    ];
    return kandidaten.filter((k) =>
      k.zeile >= 0 && k.zeile < kontext.zeilen &&
      k.spalte >= 0 && k.spalte < kontext.spalten &&
      kontext.gelaende[k.zeile][k.spalte] !== "wand"
    );
  }

  /** Kosten, um dieses Feld zu betreten: 1 auf normalem Boden, mehr im Sumpf. */
  function kosten(kontext, zelle) {
    return kontext.gelaende[zelle.zeile][zelle.spalte] === "sumpf" ? wegfindung.SUMPF_KOSTEN : 1;
  }

  /** Verfolgt die Vorgänger-Zuordnung vom Ziel zurück zum Start. */
  function wegRekonstruieren(vorgaenger, ziel) {
    const weg = [ziel];
    let aktuell = schluessel(ziel);
    while (vorgaenger.has(aktuell)) {
      const vorherige = vorgaenger.get(aktuell);
      weg.push(vorherige);
      aktuell = schluessel(vorherige);
    }
    weg.reverse();
    return weg;
  }

  /**
   * Einfache Prioritätswarteschlange für Dijkstra und A*: sucht das Minimum
   * jedes Mal per linearem Durchlauf. Bei den Gittergrößen hier (ein paar
   * hundert Felder) ist das schnell genug und bleibt dabei gut lesbar –
   * kein Heap, der vom eigentlichen Algorithmus ablenkt.
   */
  class Prioritaetswarteschlange {
    constructor() {
      this._eintraege = [];
    }

    get leer() {
      return this._eintraege.length === 0;
    }

    einfuegen(wert, prioritaet) {
      this._eintraege.push({ wert, prioritaet });
    }

    entnehmeMinimum() {
      let minIndex = 0;
      for (let i = 1; i < this._eintraege.length; i++) {
        if (this._eintraege[i].prioritaet < this._eintraege[minIndex].prioritaet) minIndex = i;
      }
      return this._eintraege.splice(minIndex, 1)[0].wert;
    }
  }

  /** Manhattan-Entfernung – die Schätzung, die A* verwendet (nur waagerecht/senkrecht gelaufen). */
  function heuristik(a, b) {
    return Math.abs(a.zeile - b.zeile) + Math.abs(a.spalte - b.spalte);
  }

  /**
   * Lässt den Algorithmus laufen und ergänzt jeden Schritt um eine
   * Momentaufnahme: alle bisher besuchten Felder, den gefundenen Weg (sobald
   * bekannt) und die beiden Zähler.
   */
  function* protokolliere(algorithmus, kontext, start, ziel) {
    const besucht = new Set([schluessel(start)]);
    let besuchteAnzahl = 0;
    let letzteVariablen = {};
    let wegZellen = null;

    /** Summe der Kosten, um von Start bis Ziel zu laufen (Start selbst kostet nichts). */
    function wegkosten(zellen) {
      return zellen.slice(1).reduce((summe, zelle) => summe + kosten(kontext, zelle), 0);
    }

    yield {
      typ: "start",
      zeile: null,
      variablen: {},
      text: "Suche einen Weg vom Start (S) zum Ziel (Z).",
      besucht: [...besucht],
      weg: null,
      besuchteAnzahl,
      weglaenge: null,
      wegkosten: null
    };

    for (const schritt of algorithmus.suche(kontext, start, ziel)) {
      if (schritt.typ === "besuchen") besuchteAnzahl++;
      if (schritt.typ === "entdecken") besucht.add(schluessel(schritt.zelle));
      if (schritt.typ === "weg") wegZellen = schritt.zellen;
      letzteVariablen = schritt.variablen || letzteVariablen;

      yield {
        ...schritt,
        besucht: [...besucht],
        weg: wegZellen,
        besuchteAnzahl,
        weglaenge: wegZellen ? wegZellen.length - 1 : null,
        wegkosten: wegZellen ? wegkosten(wegZellen) : null
      };
    }

    yield {
      typ: "fertig",
      zeile: wegZellen ? "rueckgabe" : "ende",
      variablen: letzteVariablen,
      text: wegZellen
        ? `Weg gefunden! ${wegZellen.length - 1} Schritte lang mit Gesamtkosten ${wegkosten(wegZellen)}, dabei wurden ${besuchteAnzahl} Felder besucht.`
        : `Kein Weg gefunden – ${besuchteAnzahl} Felder besucht, das Ziel ist von hier aus nicht erreichbar.`,
      besucht: [...besucht],
      weg: wegZellen,
      besuchteAnzahl,
      weglaenge: wegZellen ? wegZellen.length - 1 : null,
      wegkosten: wegZellen ? wegkosten(wegZellen) : null
    };
  }

  // ----------------------------------------------------------------------
  // Bereich mit Bedienung
  // ----------------------------------------------------------------------

  class WegfindungBereich {
    /** @param {HTMLElement} wurzel die <section> des Bereichs */
    constructor(wurzel) {
      const finde = (id) => wurzel.querySelector("#" + id);
      this.el = {
        auswahl: finde("weg-auswahl"),
        werkzeug: finde("weg-werkzeug"),
        leeren: finde("weg-leeren"),
        zufall: finde("weg-zufall"),
        sprache: finde("weg-sprache"),
        kopieren: finde("weg-kopieren"),
        info: finde("weg-info"),
        erklaerung: finde("weg-erklaerung"),
        start: finde("weg-start"),
        vor: finde("weg-vor"),
        zurueck: finde("weg-zurueck"),
        zuruecksetzen: finde("weg-zuruecksetzen"),
        tempo: finde("weg-tempo"),
        besucht: finde("weg-besucht"),
        weglaenge: finde("weg-weglaenge"),
        wegkosten: finde("weg-kosten"),
        schritte: finde("weg-schritte")
      };

      this.code = new TRACE.Codeansicht(finde("weg-code"));
      TRACE.verbindeKopierKnopf(this.el.kopieren, () => this.code.holeText());
      this.schreibtisch = new TRACE.Schreibtisch(finde("weg-schreibtisch"));
      this.player = new TRACE.Player({
        beiSchritt: (schritt, index, vorheriger) => this._zeigeSchritt(schritt, index, vorheriger),
        beiStatus: (status) => this._zeigeStatus(status)
      });
      this.player.setzeTempo(Number(this.el.tempo.value));

      this.algorithmus = algorithmen[0];
      this.sprache = "pseudocode";
      this._letzteZeile = null;

      this.gitter = new wegfindung.Gitteransicht(finde("weg-leinwand"), () => this._neuLaden());
      this.gitter.zufallsGelaende(); // gleich ein Beispiel-Gitter statt eines leeren

      this._baueAuswahl();
      this._verbindeBedienung();
      this._waehle(this.algorithmus);
    }

    anhalten() {
      this.player.pause();
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
          this.gitter.zufallsGelaende();
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
      el.leeren.addEventListener("click", () => this.gitter.leeren());
      el.zufall.addEventListener("click", () => this.gitter.zufallsGelaende());
      el.tempo.addEventListener("input", () => this.player.setzeTempo(Number(el.tempo.value)));

      for (const knopf of el.werkzeug.children) {
        knopf.addEventListener("click", () => {
          if (knopf.dataset.werkzeug === this.gitter.werkzeug) return;
          this.gitter.setzeWerkzeug(knopf.dataset.werkzeug);
          for (const k of el.werkzeug.children) k.setAttribute("aria-pressed", String(k === knopf));
        });
      }

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
      this._neuLaden();
    }

    _neuLaden() {
      this.schreibtisch.neuBeginnen();
      const kontext = { gelaende: this.gitter.gelaende, zeilen: this.gitter.zeilen, spalten: this.gitter.spalten };
      this.player.laden(protokolliere(this.algorithmus, kontext, this.gitter.start, this.gitter.ziel));
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
        ["Laufzeit", info.laufzeit, "Wie die Laufzeit mit der Gittergröße wächst"],
        ["Speicher", info.speicher, "zusätzlicher Speicherbedarf"],
        ["kürzester Weg", info.kuerzesterWeg ? "garantiert" : "nicht garantiert", "Findet das Verfahren immer den kürzesten Weg?"]
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
      this.gitter.zeige(schritt);
      this.code.markiere(schritt.zeile);
      this.schreibtisch.zeige(this.player.schritte, index);
      this.el.erklaerung.textContent = schritt.text;
      this.el.besucht.textContent = schritt.besuchteAnzahl;
      this.el.weglaenge.textContent = schritt.weglaenge != null ? schritt.weglaenge : "–";
      this.el.wegkosten.textContent = schritt.wegkosten != null ? schritt.wegkosten : "–";
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

  Object.assign(wegfindung, {
    registriere,
    algorithmen,
    schluessel,
    nachbarn,
    kosten,
    wegRekonstruieren,
    heuristik,
    Prioritaetswarteschlange,
    WegfindungBereich
  });
})(window.TRACE, window.TRACE.wegfindung);
