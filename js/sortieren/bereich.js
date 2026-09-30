/**
 * Sortier-Bereich
 * ---------------
 * Verbindet Algorithmen, Player und Darstellung für den Bereich "Sortieren".
 *
 * Aufgaben:
 *  - zentrale Liste der Sortier-Algorithmen (registriere)
 *  - jeden Schritt eines Algorithmus mit dem aktuellen Zustand anreichern
 *    (Werte, fertige Positionen, Zähler), damit "Schritt zurück" möglich ist
 *  - Bedienelemente mit dem Player verbinden
 *
 * Ein Algorithmus ist ein Objekt mit id, name, info, code und einer
 * Generator-Funktion `sortiere(a)`. Er sortiert das Array `a` direkt und
 * beschreibt dabei mit `yield` jeden Schritt, zum Beispiel:
 *
 *   yield {
 *     typ: "vergleich",           // "vergleich", "tausch", "markieren", "platziert"
 *     indizes: [3, 4],            // welche Elemente betroffen sind
 *     zeile: "vergleich",         // Marke der Code-Zeile (siehe codeansicht.js)
 *     variablen: { i: 2, j: 3 },  // für den Schreibtischtest
 *     text: "8 ist größer als 3, also werden sie getauscht.",
 *     // optional:
 *     zeiger: { i: 2, j: 3 },     // Beschriftung unter den Balken
 *     gemerkt: [5],               // Elemente, die sich der Algorithmus merkt (blau)
 *     bereich: { von, bis, text },// hinterlegter Arbeitsbereich (blau)
 *     platziert: [7]              // Elemente, die jetzt endgültig richtig stehen
 *   };
 */
window.TRACE = window.TRACE || {};
window.TRACE.sortieren = window.TRACE.sortieren || {};

(function (TRACE, sortieren) {
  "use strict";

  const algorithmen = [];

  /** Nimmt einen Algorithmus in die Auswahl auf. */
  function registriere(algorithmus) {
    algorithmen.push(algorithmus);
  }

  /** Vertauscht zwei Elemente im Array. */
  function tausche(a, i, j) {
    const hilf = a[i];
    a[i] = a[j];
    a[j] = hilf;
  }

  /** Liefert [von, von+1, …, bis]. */
  function indexbereich(von, bis) {
    const ergebnis = [];
    for (let i = von; i <= bis; i++) ergebnis.push(i);
    return ergebnis;
  }

  /** Zufallszahlen zwischen 5 und 99. */
  function zufallszahlen(anzahl) {
    return Array.from({ length: anzahl }, () => 5 + Math.floor(Math.random() * 95));
  }

  /** Zufallszahlen, aber schon aufsteigend sortiert. */
  function sortierteZahlen(anzahl) {
    return zufallszahlen(anzahl).sort((a, b) => a - b);
  }

  /** Zufallszahlen, absteigend sortiert – der schlimmste Fall für viele Verfahren. */
  function umgekehrteZahlen(anzahl) {
    return sortierteZahlen(anzahl).reverse();
  }

  /** Sortierte Zahlen mit ein paar wenigen vertauschten Nachbarn. */
  function fastSortierteZahlen(anzahl) {
    const a = sortierteZahlen(anzahl);
    const vertauschungen = Math.max(1, Math.round(anzahl * 0.08));
    for (let k = 0; k < vertauschungen && anzahl > 1; k++) {
      const i = Math.floor(Math.random() * (anzahl - 1));
      tausche(a, i, i + 1);
    }
    return a;
  }

  /** Zahlen aus einem kleinen Vorrat, damit viele Werte gleich sind. */
  function vieleGleicheWerte(anzahl) {
    const groesseDesVorrats = Math.max(3, Math.min(6, Math.round(anzahl / 4)));
    const vorrat = zufallszahlen(groesseDesVorrats);
    return Array.from({ length: anzahl }, () => vorrat[Math.floor(Math.random() * vorrat.length)]);
  }

  const ERZEUGER = {
    zufaellig: zufallszahlen,
    sortiert: sortierteZahlen,
    umgekehrt: umgekehrteZahlen,
    fastSortiert: fastSortierteZahlen,
    gleicheWerte: vieleGleicheWerte
  };

  const MAX_EIGENE_ZAHLEN = 200;

  /** Liest eine Liste von durch Komma/Leerzeichen getrennten ganzen Zahlen (1–999). */
  function leseEigeneZahlen(text) {
    const teile = text.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
    const zahlen = [];
    const ungueltig = [];
    for (const teil of teile) {
      const zahl = Number(teil);
      if (Number.isInteger(zahl) && zahl >= 1 && zahl <= 999) zahlen.push(zahl);
      else ungueltig.push(teil);
    }
    return { zahlen, ungueltig };
  }

  /**
   * Lässt den Algorithmus auf einer Kopie der Werte laufen und ergänzt jeden
   * Schritt um eine Momentaufnahme: Werte, fertige Positionen und Zähler.
   * Der Algorithmus selbst bleibt dadurch kurz und lesbar.
   */
  function* protokolliere(algorithmus, ausgangswerte) {
    const a = ausgangswerte.slice();
    const n = a.length;
    const sortiert = new Set();
    let vergleiche = 0;
    let vertauschungen = 0;
    let letzteVariablen = {};

    yield {
      typ: "start",
      zeile: null,
      variablen: {},
      text: `Ausgangslage: ${n} unsortierte Zahlen. Drücke Start oder gehe mit „Schritt ▶“ einzeln weiter.`,
      werte: a.slice(),
      sortiert: [],
      vergleiche,
      vertauschungen
    };

    for (const schritt of algorithmus.sortiere(a)) {
      if (schritt.typ === "vergleich") vergleiche++;
      if (schritt.typ === "tausch") vertauschungen++;
      for (const index of schritt.platziert || []) sortiert.add(index);
      letzteVariablen = schritt.variablen || letzteVariablen;

      yield {
        ...schritt,
        werte: a.slice(),
        sortiert: [...sortiert],
        vergleiche,
        vertauschungen
      };
    }

    yield {
      typ: "fertig",
      zeile: "ende",
      variablen: letzteVariablen,
      text: `Fertig! Alle ${n} Zahlen sind sortiert – mit ${vergleiche} Vergleichen und ${vertauschungen} Vertauschungen.`,
      werte: a.slice(),
      sortiert: indexbereich(0, n - 1),
      vergleiche,
      vertauschungen
    };
  }

  // ----------------------------------------------------------------------
  // Bereich mit Bedienung
  // ----------------------------------------------------------------------

  class SortierBereich {
    /** @param {HTMLElement} wurzel die <section> des Bereichs */
    constructor(wurzel) {
      const finde = (id) => wurzel.querySelector("#" + id);
      this.el = {
        auswahl: finde("sort-auswahl"),
        eingabe: finde("sort-eingabe"),
        anzahlFeld: finde("sort-anzahl-feld"),
        anzahl: finde("sort-anzahl"),
        anzahlWert: finde("sort-anzahl-wert"),
        mischen: finde("sort-mischen"),
        eigeneFeld: finde("sort-eigene-feld"),
        eigeneEingabe: finde("sort-eigene-eingabe"),
        eigeneAnwenden: finde("sort-eigene-anwenden"),
        eigeneHinweis: finde("sort-eigene-hinweis"),
        sprache: finde("sort-sprache"),
        kopieren: finde("sort-kopieren"),
        info: finde("sort-info"),
        erklaerung: finde("sort-erklaerung"),
        start: finde("sort-start"),
        vor: finde("sort-vor"),
        zurueck: finde("sort-zurueck"),
        zuruecksetzen: finde("sort-zuruecksetzen"),
        tempo: finde("sort-tempo"),
        vergleiche: finde("sort-vergleiche"),
        vertauschungen: finde("sort-vertauschungen"),
        schritte: finde("sort-schritte")
      };

      this.ansicht = new sortieren.Balkenansicht(finde("sort-leinwand"));
      this.code = new TRACE.Codeansicht(finde("sort-code"));
      TRACE.verbindeKopierKnopf(this.el.kopieren, () => this.code.holeText());
      this.schreibtisch = new TRACE.Schreibtisch(finde("sort-schreibtisch"));
      this.player = new TRACE.Player({
        beiSchritt: (schritt, index, vorheriger) => this._zeigeSchritt(schritt, index, vorheriger),
        beiStatus: (status) => this._zeigeStatus(status)
      });
      this.player.setzeTempo(Number(this.el.tempo.value));

      this.algorithmus = algorithmen[0];
      this.sprache = "pseudocode";
      this.eingabeArt = "zufaellig";
      this.eigeneWerte = null;
      this._letzteZeile = null;
      this.werte = this._erzeugeWerte();

      this._baueAuswahl();
      this._verbindeBedienung();
      this._waehle(this.algorithmus);
    }

    /** Hält den Ablauf an, z. B. wenn der Bereich verlassen wird. */
    anhalten() {
      this.player.pause();
    }

    /** Neue Zahlen nach der aktuellen Eingabe-Art, Algorithmus startet von vorn. */
    mischen() {
      if (this.eingabeArt !== "eigene") this.werte = this._erzeugeWerte();
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
          if (istRegler) return false; // Pfeile bewegen dann den Regler
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

      el.eingabe.addEventListener("change", () => {
        this.eingabeArt = el.eingabe.value;
        this._zeigeEingabeModus();
        if (this.eingabeArt === "eigene") {
          if (this.eigeneWerte) {
            this.werte = this.eigeneWerte.slice();
            this._neuLaden();
          } else {
            el.eigeneEingabe.value = "5, 3, 8, 1, 9";
            this._wendeEigeneZahlenAn();
          }
        } else {
          this.mischen();
        }
      });
      el.eigeneAnwenden.addEventListener("click", () => this._wendeEigeneZahlenAn());
      el.eigeneEingabe.addEventListener("keydown", (ereignis) => {
        if (ereignis.key === "Enter") {
          ereignis.preventDefault();
          this._wendeEigeneZahlenAn();
        }
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
      this._neuLaden();
    }

    /** Erzeugt neue Werte passend zur gewählten Eingabe-Art (außer "eigene"). */
    _erzeugeWerte() {
      const anzahl = Number(this.el.anzahl.value);
      const erzeuger = ERZEUGER[this.eingabeArt] || zufallszahlen;
      return erzeuger(anzahl);
    }

    /** Zeigt Anzahl-Regler oder das Eingabefeld für eigene Zahlen, je nach Eingabe-Art. */
    _zeigeEingabeModus() {
      const eigene = this.eingabeArt === "eigene";
      this.el.anzahlFeld.hidden = eigene;
      this.el.mischen.hidden = eigene;
      this.el.eigeneFeld.hidden = !eigene;
    }

    /** Liest das Eingabefeld für eigene Zahlen aus, prüft es und lädt die Werte. */
    _wendeEigeneZahlenAn() {
      const { zahlen, ungueltig } = leseEigeneZahlen(this.el.eigeneEingabe.value);
      const hinweise = [];

      if (ungueltig.length) {
        hinweise.push(`Ignoriert, weil keine ganze Zahl von 1 bis 999: ${ungueltig.join(", ")}.`);
      }
      if (zahlen.length < 2) {
        hinweise.unshift("Bitte mindestens zwei ganze Zahlen eingeben, z. B. „5, 3, 8, 1, 9“.");
        this.el.eigeneHinweis.textContent = hinweise.join(" ");
        return;
      }

      let benutzt = zahlen;
      if (zahlen.length > MAX_EIGENE_ZAHLEN) {
        benutzt = zahlen.slice(0, MAX_EIGENE_ZAHLEN);
        hinweise.push(`Nur die ersten ${MAX_EIGENE_ZAHLEN} Zahlen werden verwendet.`);
      }

      this.eigeneWerte = benutzt;
      this.el.eigeneHinweis.textContent = hinweise.join(" ");
      this.werte = benutzt.slice();
      this._neuLaden();
    }

    _neuLaden() {
      this.schreibtisch.neuBeginnen();
      this.player.laden(protokolliere(this.algorithmus, this.werte));
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
        ["stabil", info.stabil ? "ja" : "nein", "Stabil: Gleiche Werte behalten ihre Reihenfolge."]
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
      this.el.vertauschungen.textContent = schritt.vertauschungen;
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

  Object.assign(sortieren, {
    registriere,
    tausche,
    indexbereich,
    algorithmen,
    SortierBereich
  });
})(window.TRACE, window.TRACE.sortieren);
