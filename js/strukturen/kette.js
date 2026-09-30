/**
 * Kette (Stapel und Warteschlange)
 * --------------------------------
 * Stapel (LIFO) und Warteschlange (FIFO) unterscheiden sich nur darin, an
 * welchem Ende Elemente wieder entfernt werden – der Rest ist identisch.
 * Deshalb steckt hier die gemeinsame Technik für beide an einem Ort: eine
 * kleine Mini-Sprache für Operationen, eine Generator-Funktion, die sie
 * anwendet, eine Kästchen-Darstellung und ein Bereich-Controller. Registriert
 * werden am Ende zwei eigenständige Bereiche ("stapel" und "warteschlange"),
 * die diese gemeinsame Technik mit unterschiedlicher Beschriftung nutzen.
 *
 * Operationen werden als Text eingegeben, z. B. "5, 3, 8, -, 2, -, -":
 * eine Zahl legt einen Wert hinein, ein Minuszeichen nimmt eines heraus.
 */
window.TRACE = window.TRACE || {};
window.TRACE.strukturen = window.TRACE.strukturen || {};

(function (TRACE, strukturen) {
  "use strict";

  // ----------------------------------------------------------------------
  // Operationen lesen und anwenden
  // ----------------------------------------------------------------------

  /** Liest "5, 3, -, 8" in eine Liste von Operationen. */
  function leseOperationen(text) {
    const teile = text.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
    const operationen = [];
    const ungueltig = [];
    for (const teil of teile) {
      if (teil === "-") {
        operationen.push({ typ: "entfernen" });
        continue;
      }
      const zahl = Number(teil);
      if (Number.isInteger(zahl) && zahl >= 1 && zahl <= 999) operationen.push({ typ: "hinzufuegen", wert: zahl });
      else ungueltig.push(teil);
    }
    return { operationen, ungueltig };
  }

  /** Erzeugt eine zufällige, aber gültige Operationenfolge als Text. */
  function zufallsOperationen() {
    const anzahl = 6 + Math.floor(Math.random() * 4);
    const teile = [];
    let groesse = 0;
    for (let i = 0; i < anzahl; i++) {
      const entfernen = groesse > 0 && Math.random() < 0.35;
      if (entfernen) {
        teile.push("-");
        groesse--;
      } else {
        teile.push(String(1 + Math.floor(Math.random() * 99)));
        groesse++;
      }
    }
    return teile.join(", ");
  }

  /**
   * Wendet die Operationen nacheinander an. `modus` bestimmt, an welchem
   * Ende entfernt wird: "stapel" (dasselbe Ende wie beim Hinzufügen, LIFO)
   * oder "warteschlange" (das andere Ende, FIFO).
   */
  function* wendeOperationenAn(operationen, modus) {
    const inhalt = [];
    const hinzufuegenWort = modus === "stapel" ? "Push" : "Enqueue";
    const entfernenWort = modus === "stapel" ? "Pop" : "Dequeue";

    for (const op of operationen) {
      if (op.typ === "hinzufuegen") {
        inhalt.push(op.wert);
        yield {
          typ: "hinzufuegen",
          wert: op.wert,
          inhalt: inhalt.slice(),
          zeile: "hinzufuegen",
          variablen: { wert: op.wert, groesse: inhalt.length },
          text: modus === "stapel"
            ? `${op.wert} wird oben auf den Stapel gelegt (${hinzufuegenWort}).`
            : `${op.wert} wird hinten an die Warteschlange angehängt (${hinzufuegenWort}).`
        };
        continue;
      }

      if (inhalt.length === 0) {
        yield {
          typ: "leer",
          inhalt: inhalt.slice(),
          zeile: "leer",
          variablen: { groesse: 0 },
          text: modus === "stapel"
            ? `Der Stapel ist leer – es gibt nichts zum Herunternehmen (${entfernenWort}).`
            : `Die Warteschlange ist leer – es gibt nichts zu entfernen (${entfernenWort}).`
        };
        continue;
      }

      const entfernterWert = modus === "stapel" ? inhalt.pop() : inhalt.shift();
      yield {
        typ: "entfernen",
        wert: entfernterWert,
        inhalt: inhalt.slice(),
        zeile: "entfernen",
        variablen: { wert: entfernterWert, groesse: inhalt.length },
        text: modus === "stapel"
          ? `${entfernterWert} wird oben vom Stapel heruntergenommen (${entfernenWort}).`
          : `${entfernterWert} wird vorne aus der Warteschlange entfernt (${entfernenWort}).`
      };
    }
  }

  // ----------------------------------------------------------------------
  // Darstellung: Kästchen in einer Reihe (Warteschlange, bricht bei Bedarf
  // um) oder in einer einzelnen Spalte (Stapel).
  // ----------------------------------------------------------------------

  const RAND = 8;
  const ZAHLEN_HOEHE = 0;
  const MIN_SPALTE = 46;

  function leseFarben() {
    const stil = getComputedStyle(document.documentElement);
    const farbe = (name) => stil.getPropertyValue(name).trim();
    return {
      neutral: farbe("--neutral"),
      aendern: farbe("--aendern"),
      text: farbe("--text"),
      textAufFarbe: "#111318",
      textLeise: farbe("--text-leise"),
      schrift: getComputedStyle(document.body).fontFamily
    };
  }

  class Kettenansicht {
    /**
     * @param {HTMLCanvasElement} leinwand liegt in einem (bei Bedarf scrollbaren) Wrapper-Div
     * @param {"stapel"|"warteschlange"} modus bestimmt die Spaltenzahl: 1 (Stapel) oder mehrere (Warteschlange)
     */
    constructor(leinwand, modus) {
      this.leinwand = leinwand;
      this.wrapper = leinwand.parentElement;
      this.ctx = leinwand.getContext("2d");
      this.modus = modus;
      this.schritt = null;
      this.layout = null;
      this.dpr = window.devicePixelRatio || 1;

      new ResizeObserver(() => this._aktualisiereGroesse()).observe(this.wrapper);
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.zeichne());
      // Reagiert zusätzlich auf den manuellen Hell/Dunkel-Knopf (js/ui/theme.js).
      window.addEventListener("trace:farbschema-geaendert", () => this.zeichne());
    }

    /** @param {{anzeige: number[], hervorgehoben: number|null}} schritt anzeige = Werte in Anzeige-Reihenfolge */
    zeige(schritt) {
      this.schritt = schritt;
      this._aktualisiereGroesse();
    }

    _layoutBerechnen() {
      const n = Math.max(this.schritt.anzeige.length, 1);
      const verfuegbar = this.wrapper.clientWidth;
      const proReihe = this.modus === "stapel" ? 1 : Math.max(1, Math.min(n, Math.floor(verfuegbar / MIN_SPALTE)));
      const reihenAnzahl = Math.max(1, Math.ceil(n / proReihe));

      const spalte = this.modus === "stapel" ? Math.min(verfuegbar, 160) : verfuegbar / proReihe;
      const luecke = Math.max(2, Math.min(8, spalte * 0.12));
      const kastenBreite = Math.max(1, spalte - luecke);
      const kastenHoehe = this.modus === "stapel" ? 40 : Math.max(34, Math.min(kastenBreite * 0.7, 56));
      const reihenHoehe = kastenHoehe + 10;

      return {
        n, proReihe, spalte, luecke, kastenBreite, kastenHoehe,
        breite: this.modus === "stapel" ? verfuegbar : verfuegbar,
        hoehe: RAND * 2 + reihenAnzahl * reihenHoehe
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

    _position(i) {
      const l = this.layout;
      const zeile = Math.floor(i / l.proReihe);
      const spalteIndex = i % l.proReihe;
      const reihenHoehe = l.kastenHoehe + 10;
      const xStart = this.modus === "stapel" ? (l.breite - l.kastenBreite) / 2 : RAND;
      return {
        x: this.modus === "stapel" ? xStart : RAND + spalteIndex * l.spalte,
        y: RAND + zeile * reihenHoehe
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

      const werte = s.anzeige;
      if (werte.length === 0) {
        ctx.fillStyle = f.textLeise;
        ctx.font = `500 14px ${f.schrift}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("(leer)", RAND, RAND);
        return;
      }

      for (let i = 0; i < werte.length; i++) {
        const pos = this._position(i);
        const hervorgehoben = i === s.hervorgehoben;

        ctx.fillStyle = hervorgehoben ? f.aendern : f.neutral;
        this._kaestchen(pos.x, pos.y, l.kastenBreite, l.kastenHoehe, 6);

        ctx.fillStyle = hervorgehoben ? f.textAufFarbe : f.text;
        ctx.font = `700 ${Math.min(17, l.kastenHoehe * 0.4)}px ${f.schrift}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(werte[i]), pos.x + l.kastenBreite / 2, pos.y + l.kastenHoehe / 2);
      }

      this._beschrifteEnden(f);
    }

    _beschrifteEnden(f) {
      const l = this.layout;
      const ctx = this.ctx;
      ctx.fillStyle = f.textLeise;
      ctx.font = `600 11px ${f.schrift}`;
      ctx.textBaseline = "top";

      if (this.modus === "stapel") {
        const oben = this._position(0);
        ctx.textAlign = "center";
        ctx.fillText("↑ oben (Push/Pop hier)", l.breite / 2, Math.max(0, oben.y - 14));
      } else {
        ctx.textAlign = "left";
        ctx.fillText("vorne (Dequeue)", RAND, 0);
        ctx.textAlign = "right";
        ctx.fillText("hinten (Enqueue) →", l.breite - RAND, 0);
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
  }

  // ----------------------------------------------------------------------
  // Protokoll: reichert jeden Schritt mit einer Momentaufnahme an
  // ----------------------------------------------------------------------

  function* protokolliere(operationen, modus) {
    let anzahlOperationen = 0;

    yield {
      typ: "start",
      zeile: null,
      variablen: {},
      text: modus === "stapel"
        ? "Noch leer. Jede Zahl in der Eingabe legt einen Wert hinein (Push), ein „-“ nimmt den obersten wieder herunter (Pop)."
        : "Noch leer. Jede Zahl in der Eingabe reiht einen Wert hinten ein (Enqueue), ein „-“ nimmt den vordersten wieder heraus (Dequeue).",
      inhalt: [],
      groesse: 0,
      anzahlOperationen
    };

    for (const schritt of wendeOperationenAn(operationen, modus)) {
      if (schritt.typ === "hinzufuegen" || schritt.typ === "entfernen") anzahlOperationen++;
      yield { ...schritt, groesse: schritt.inhalt.length, anzahlOperationen };
    }
  }

  /** Wandelt den internen Inhalt (0 = zuerst hinzugefügt) in Anzeige-Reihenfolge um. */
  function anzeigeReihenfolge(inhalt, modus) {
    // Stapel: Neuestes zuerst (oben in der Darstellung). Warteschlange: Ältestes
    // zuerst (vorne in der Darstellung) – das ist bereits die natürliche Reihenfolge.
    return modus === "stapel" ? inhalt.slice().reverse() : inhalt.slice();
  }

  /** Index des zuletzt betroffenen Werts in der Anzeige-Reihenfolge, oder null. */
  function hervorgehobenerIndex(schritt, modus) {
    if (schritt.typ !== "hinzufuegen") return null;
    return modus === "stapel" ? 0 : schritt.inhalt.length - 1;
  }

  // ----------------------------------------------------------------------
  // Bereich mit Bedienung – für Stapel und Warteschlange gleichermaßen
  // ----------------------------------------------------------------------

  class KetteBereich {
    /**
     * @param {HTMLElement} wurzel die <section> des Bereichs
     * @param {object} konfiguration { modus, praefix, code, standardEingabe }
     */
    constructor(wurzel, konfiguration) {
      this.modus = konfiguration.modus;
      this.code = konfiguration.code;
      const p = konfiguration.praefix;

      const finde = (id) => wurzel.querySelector("#" + id);
      this.el = {
        eingabe: finde(`${p}-eingabe`),
        anwenden: finde(`${p}-anwenden`),
        zufall: finde(`${p}-zufall`),
        hinweis: finde(`${p}-hinweis`),
        sprache: finde(`${p}-sprache`),
        kopieren: finde(`${p}-kopieren`),
        info: finde(`${p}-info`),
        erklaerung: finde(`${p}-erklaerung`),
        start: finde(`${p}-start`),
        vor: finde(`${p}-vor`),
        zurueck: finde(`${p}-zurueck`),
        zuruecksetzen: finde(`${p}-zuruecksetzen`),
        tempo: finde(`${p}-tempo`),
        groesse: finde(`${p}-groesse`),
        operationen: finde(`${p}-operationen`),
        schritte: finde(`${p}-schritte`)
      };

      this.ansicht = new Kettenansicht(finde(`${p}-leinwand`), this.modus);
      this.codeansicht = new TRACE.Codeansicht(finde(`${p}-code`));
      TRACE.verbindeKopierKnopf(this.el.kopieren, () => this.codeansicht.holeText());
      this.schreibtisch = new TRACE.Schreibtisch(finde(`${p}-schreibtisch`));
      this.player = new TRACE.Player({
        beiSchritt: (schritt, index, vorheriger) => this._zeigeSchritt(schritt, index, vorheriger),
        beiStatus: (status) => this._zeigeStatus(status)
      });
      this.player.setzeTempo(Number(this.el.tempo.value));

      this.sprache = "pseudocode";
      this._letzteZeile = null;
      this.codeansicht.setzeCode(this.code[this.sprache]);
      this._zeigeInfo(konfiguration.info);

      this.el.eingabe.value = konfiguration.standardEingabe;
      this._verbindeBedienung();
      this._wendeEingabeAn();
    }

    anhalten() {
      this.player.pause();
    }

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
        default:
          return false;
      }
    }

    // ------------------------------------------------------------------
    // intern
    // ------------------------------------------------------------------

    _verbindeBedienung() {
      const el = this.el;
      el.start.addEventListener("click", () => this.player.umschalten());
      el.vor.addEventListener("click", () => this.player.vor());
      el.zurueck.addEventListener("click", () => this.player.zurueck());
      el.zuruecksetzen.addEventListener("click", () => this.player.zumAnfang());
      el.tempo.addEventListener("input", () => this.player.setzeTempo(Number(el.tempo.value)));
      el.anwenden.addEventListener("click", () => this._wendeEingabeAn());
      el.zufall.addEventListener("click", () => {
        el.eingabe.value = zufallsOperationen();
        this._wendeEingabeAn();
      });
      el.eingabe.addEventListener("keydown", (ereignis) => {
        if (ereignis.key === "Enter") {
          ereignis.preventDefault();
          this._wendeEingabeAn();
        }
      });

      for (const knopf of el.sprache.children) {
        knopf.addEventListener("click", () => {
          if (knopf.dataset.sprache === this.sprache) return;
          this.sprache = knopf.dataset.sprache;
          for (const k of el.sprache.children) k.setAttribute("aria-pressed", String(k === knopf));
          this.codeansicht.setzeCode(this.code[this.sprache]);
          this.codeansicht.markiere(this._letzteZeile);
        });
      }
    }

    _wendeEingabeAn() {
      const { operationen, ungueltig } = leseOperationen(this.el.eingabe.value);
      this.el.hinweis.textContent = ungueltig.length
        ? `Ignoriert, weil weder ganze Zahl (1–999) noch „-“: ${ungueltig.join(", ")}.`
        : "";

      this.schreibtisch.neuBeginnen();
      this.player.laden(protokolliere(operationen, this.modus));
    }

    _zeigeInfo(info) {
      const absatz = document.createElement("p");
      absatz.append(info.beschreibung);

      const kennzahlen = document.createElement("ul");
      kennzahlen.className = "kennzahlen";
      for (const [bezeichnung, wert, erklaerung] of info.kennzahlen) {
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
      const anzeige = anzeigeReihenfolge(schritt.inhalt || [], this.modus);
      const hervorgehoben = schritt.typ === "hinzufuegen" ? hervorgehobenerIndex(schritt, this.modus) : null;
      this.ansicht.zeige({ anzeige, hervorgehoben });
      this.codeansicht.markiere(schritt.zeile);
      this.schreibtisch.zeige(this.player.schritte, index);
      this.el.erklaerung.textContent = schritt.text;
      this.el.groesse.textContent = schritt.groesse;
      this.el.operationen.textContent = schritt.anzahlOperationen;
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

  Object.assign(strukturen, { leseOperationen, wendeOperationenAn, Kettenansicht, KetteBereich });
})(window.TRACE, window.TRACE.strukturen);
