/**
 * Binärer Suchbaum
 * ----------------
 * Jeder Knoten hat höchstens zwei Kinder. Für jeden Knoten gilt: Alle Werte
 * im linken Teilbaum sind kleiner, alle Werte im rechten Teilbaum sind
 * größer. Dadurch lässt sich sowohl das Einfügen als auch das Suchen bei
 * jedem Schritt eine Seite ausschließen – ähnlich wie bei der binären Suche,
 * nur auf einer Baumstruktur statt auf einem sortierten Array.
 *
 * Wie schnell das geht, hängt stark von der Form des Baums ab: Bei
 * zufälligen Werten bleibt er ungefähr ausgeglichen (Tiefe ~ log n). Werden
 * die Werte aber bereits sortiert eingefügt (z. B. 1, 2, 3, 4, 5), hängt
 * jeder neue Wert immer nur rechts an – der Baum entartet zu einer Liste,
 * und Suchen wird so langsam wie die lineare Suche (O(n) statt O(log n)).
 * Das lässt sich hier direkt ausprobieren.
 */
window.TRACE = window.TRACE || {};
window.TRACE.strukturen = window.TRACE.strukturen || {};

(function (TRACE, strukturen) {
  "use strict";

  /** Erzeugt zufällige, verschiedene Werte plus ein Suchziel daraus. */
  function zufallsWerte() {
    const anzahl = 6 + Math.floor(Math.random() * 4);
    const menge = new Set();
    while (menge.size < anzahl) menge.add(1 + Math.floor(Math.random() * 99));
    const werte = [...menge];
    for (let i = werte.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [werte[i], werte[j]] = [werte[j], werte[i]];
    }
    const ziel = werte[Math.floor(Math.random() * werte.length)];
    return { werte, ziel };
  }

  function neuerKnoten(wert) {
    return { wert, links: null, rechts: null };
  }

  function klonBaum(knoten) {
    if (!knoten) return null;
    return { wert: knoten.wert, links: klonBaum(knoten.links), rechts: klonBaum(knoten.rechts) };
  }

  function hervorhebungVonTyp(typ) {
    if (typ === "einfuegen") return "einfuegen";
    if (typ === "gefunden" || typ === "vorhanden") return "gefunden";
    return "vergleich";
  }

  /** Fügt `wert` in den Baum ein (mutiert `baum.wurzel`). */
  function* einfuegen(baum, wert) {
    if (!baum.wurzel) {
      baum.wurzel = neuerKnoten(wert);
      yield {
        typ: "einfuegen", pfad: [wert], zeile: "neueWurzel",
        variablen: { wert }, text: `Der Baum ist leer: ${wert} wird die Wurzel.`
      };
      return;
    }

    let aktuell = baum.wurzel;
    const pfad = [];
    while (true) {
      pfad.push(aktuell.wert);
      const kleiner = wert < aktuell.wert;
      const gleich = wert === aktuell.wert;

      yield {
        typ: "vergleich", pfad: pfad.slice(), zeile: "vergleichEinfuegen",
        variablen: { aktuell: aktuell.wert, wert },
        text: gleich
          ? `${wert} ist gleich ${aktuell.wert}.`
          : kleiner
            ? `${wert} ist kleiner als ${aktuell.wert} – weiter nach links.`
            : `${wert} ist größer als ${aktuell.wert} – weiter nach rechts.`
      };

      if (gleich) {
        yield {
          typ: "vorhanden", pfad: pfad.slice(), zeile: "vorhanden",
          variablen: { aktuell: aktuell.wert, wert }, text: `${wert} ist schon im Baum – nichts zu tun.`
        };
        return;
      }

      if (kleiner) {
        if (!aktuell.links) {
          aktuell.links = neuerKnoten(wert);
          yield {
            typ: "einfuegen", pfad: [...pfad, wert], zeile: "einfuegenLinks",
            variablen: { aktuell: aktuell.wert, wert }, text: `Links von ${aktuell.wert} ist noch frei – dort wird ${wert} eingefügt.`
          };
          return;
        }
        aktuell = aktuell.links;
      } else {
        if (!aktuell.rechts) {
          aktuell.rechts = neuerKnoten(wert);
          yield {
            typ: "einfuegen", pfad: [...pfad, wert], zeile: "einfuegenRechts",
            variablen: { aktuell: aktuell.wert, wert }, text: `Rechts von ${aktuell.wert} ist noch frei – dort wird ${wert} eingefügt.`
          };
          return;
        }
        aktuell = aktuell.rechts;
      }
    }
  }

  /** Sucht `ziel` im Baum, verändert nichts. */
  function* suchen(baum, ziel) {
    if (!baum.wurzel) {
      yield { typ: "leer", pfad: [], zeile: "leer", variablen: { ziel }, text: "Der Baum ist leer." };
      return;
    }

    let aktuell = baum.wurzel;
    const pfad = [];
    while (aktuell) {
      pfad.push(aktuell.wert);
      const kleiner = ziel < aktuell.wert;
      const gleich = ziel === aktuell.wert;

      yield {
        typ: "vergleich", pfad: pfad.slice(), zeile: "vergleichSuchen",
        variablen: { aktuell: aktuell.wert, ziel },
        text: gleich
          ? `${ziel} ist gleich ${aktuell.wert}.`
          : kleiner
            ? `${ziel} ist kleiner als ${aktuell.wert} – weiter nach links.`
            : `${ziel} ist größer als ${aktuell.wert} – weiter nach rechts.`
      };

      if (gleich) {
        yield {
          typ: "gefunden", pfad: pfad.slice(), zeile: "gefundenKnoten",
          variablen: { aktuell: aktuell.wert, ziel }, text: `Gefunden: ${ziel} ist im Baum.`
        };
        return;
      }
      aktuell = kleiner ? aktuell.links : aktuell.rechts;
    }

    yield { typ: "nichtGefunden", pfad: pfad.slice(), zeile: "nichtGefunden", variablen: { ziel }, text: `${ziel} ist nicht im Baum.` };
  }

  /** Baut den Baum aus `werte` auf und sucht danach optional `ziel` (oder null, um nur aufzubauen). */
  function* protokolliere(werte, ziel) {
    const baum = { wurzel: null };
    let vergleiche = 0;
    let letzteVariablen = {};
    let sucheErgebnis = null;

    yield {
      typ: "start", zeile: null, variablen: {},
      text: "Baum ist leer. Die Werte werden der Reihe nach eingefügt.",
      baum: null, pfad: [], hervorhebung: null, vergleiche
    };

    for (const wert of werte) {
      for (const schritt of einfuegen(baum, wert)) {
        if (schritt.typ === "vergleich") vergleiche++;
        letzteVariablen = schritt.variablen || letzteVariablen;
        yield { ...schritt, baum: klonBaum(baum.wurzel), hervorhebung: hervorhebungVonTyp(schritt.typ), vergleiche };
      }
    }

    if (ziel !== null) {
      yield {
        typ: "sucheStart", zeile: null, variablen: {},
        text: `Baum aufgebaut. Jetzt wird nach ${ziel} gesucht.`,
        baum: klonBaum(baum.wurzel), pfad: [], hervorhebung: null, vergleiche
      };
      for (const schritt of suchen(baum, ziel)) {
        if (schritt.typ === "vergleich") vergleiche++;
        if (schritt.typ === "gefunden" || schritt.typ === "nichtGefunden" || schritt.typ === "leer") sucheErgebnis = schritt.typ;
        letzteVariablen = schritt.variablen || letzteVariablen;
        yield { ...schritt, baum: klonBaum(baum.wurzel), hervorhebung: hervorhebungVonTyp(schritt.typ), vergleiche };
      }
    }

    yield {
      typ: "fertig",
      zeile: sucheErgebnis === "gefunden" ? "gefundenKnoten" : sucheErgebnis ? "nichtGefunden" : null,
      variablen: letzteVariablen,
      text: sucheErgebnis === "gefunden"
        ? `Fertig! ${ziel} wurde gefunden – insgesamt ${vergleiche} Vergleiche.`
        : sucheErgebnis === "nichtGefunden" || sucheErgebnis === "leer"
          ? `Fertig! ${ziel} ist nicht im Baum – insgesamt ${vergleiche} Vergleiche.`
          : `Fertig! Der Baum ist aufgebaut – insgesamt ${vergleiche} Vergleiche beim Einfügen.`,
      baum: klonBaum(baum.wurzel), pfad: [], hervorhebung: null, vergleiche
    };
  }

  const code = {
    pseudocode: `
      PROZEDUR Einfügen(baum, wert)
        WENN baum leer DANN
          baum.wurzel ← neuer Knoten(wert)            @@neueWurzel
          RÜCKGABE
        ENDE WENN
        aktuell ← baum.wurzel
        SOLANGE WAHR
          WENN wert = aktuell.wert DANN                @@vergleichEinfuegen
            RÜCKGABE  // schon vorhanden                 @@vorhanden
          SONST WENN wert < aktuell.wert DANN
            WENN aktuell.links = leer DANN
              aktuell.links ← neuer Knoten(wert)          @@einfuegenLinks
              RÜCKGABE
            ENDE WENN
            aktuell ← aktuell.links
          SONST
            WENN aktuell.rechts = leer DANN
              aktuell.rechts ← neuer Knoten(wert)          @@einfuegenRechts
              RÜCKGABE
            ENDE WENN
            aktuell ← aktuell.rechts
          ENDE WENN
        ENDE SOLANGE
      ENDE PROZEDUR

      FUNKTION Suchen(baum, ziel)
        WENN baum leer DANN                              @@leer
          RÜCKGABE FALSCH
        ENDE WENN
        aktuell ← baum.wurzel
        SOLANGE aktuell ≠ leer
          WENN ziel = aktuell.wert DANN                   @@vergleichSuchen
            RÜCKGABE WAHR                                   @@gefundenKnoten
          SONST WENN ziel < aktuell.wert DANN
            aktuell ← aktuell.links
          SONST
            aktuell ← aktuell.rechts
          ENDE WENN
        ENDE SOLANGE
        RÜCKGABE FALSCH                                     @@nichtGefunden
      ENDE FUNKTION
    `,
    csharp: `
      void Einfuegen(Knoten baum, int wert)
      {
          if (Wurzel == null)
          {
              Wurzel = new Knoten(wert);                      @@neueWurzel
              return;
          }
          Knoten aktuell = Wurzel;
          while (true)
          {
              if (wert == aktuell.Wert)                          @@vergleichEinfuegen
              {
                  return; // schon vorhanden                        @@vorhanden
              }
              else if (wert < aktuell.Wert)
              {
                  if (aktuell.Links == null)
                  {
                      aktuell.Links = new Knoten(wert);                @@einfuegenLinks
                      return;
                  }
                  aktuell = aktuell.Links;
              }
              else
              {
                  if (aktuell.Rechts == null)
                  {
                      aktuell.Rechts = new Knoten(wert);                @@einfuegenRechts
                      return;
                  }
                  aktuell = aktuell.Rechts;
              }
          }
      }

      bool Suchen(Knoten wurzel, int ziel)
      {
          if (wurzel == null) return false;                       @@leer
          Knoten aktuell = wurzel;
          while (aktuell != null)
          {
              if (ziel == aktuell.Wert)                              @@vergleichSuchen
              {
                  return true;                                          @@gefundenKnoten
              }
              aktuell = ziel < aktuell.Wert ? aktuell.Links : aktuell.Rechts;
          }
          return false;                                                @@nichtGefunden
      }
    `,
    javascript: `
      function einfuegen(baum, wert) {
        if (!baum.wurzel) {
          baum.wurzel = { wert, links: null, rechts: null };      @@neueWurzel
          return;
        }
        let aktuell = baum.wurzel;
        while (true) {
          if (wert === aktuell.wert) {                                @@vergleichEinfuegen
            return; // schon vorhanden                                  @@vorhanden
          } else if (wert < aktuell.wert) {
            if (!aktuell.links) {
              aktuell.links = { wert, links: null, rechts: null };        @@einfuegenLinks
              return;
            }
            aktuell = aktuell.links;
          } else {
            if (!aktuell.rechts) {
              aktuell.rechts = { wert, links: null, rechts: null };        @@einfuegenRechts
              return;
            }
            aktuell = aktuell.rechts;
          }
        }
      }

      function suchen(baum, ziel) {
        if (!baum.wurzel) return false;                             @@leer
        let aktuell = baum.wurzel;
        while (aktuell) {
          if (ziel === aktuell.wert) {                                 @@vergleichSuchen
            return true;                                                  @@gefundenKnoten
          }
          aktuell = ziel < aktuell.wert ? aktuell.links : aktuell.rechts;
        }
        return false;                                                    @@nichtGefunden
      }
    `
  };

  const info = {
    beschreibung: "Jeder Knoten hat bis zu zwei Kinder: links stehen nur kleinere Werte, rechts nur größere. So lässt sich bei jedem Schritt eine ganze Seite ausschließen.",
    kennzahlen: [
      ["Suchen/Einfügen (Ø)", "O(log n)", "bei einigermaßen ausgeglichenem Baum"],
      ["Suchen/Einfügen (schlimmster Fall)", "O(n)", "wenn der Baum zu einer Liste entartet"],
      ["Speicher", "O(n)", "ein Knoten pro Wert"]
    ],
    einsatz: "Schnelles Suchen, Einfügen und sortierte Ausgabe. Wichtig zu wissen: Werden die Werte bereits sortiert eingefügt, hängt jeder neue Wert nur rechts an, und der Baum entartet zu einer Liste – probier das mit „1, 2, 3, 4, 5, 6, 7“ als Eingabe aus."
  };

  strukturen.suchbaum = { protokolliere, code, info };

  // ----------------------------------------------------------------------
  // Bereich mit Bedienung
  // ----------------------------------------------------------------------

  class SuchbaumBereich {
    /** @param {HTMLElement} wurzel die <section> des Bereichs */
    constructor(wurzel) {
      const finde = (id) => wurzel.querySelector("#" + id);
      this.el = {
        werte: finde("suchbaum-werte"),
        ziel: finde("suchbaum-ziel"),
        anwenden: finde("suchbaum-anwenden"),
        zufall: finde("suchbaum-zufall"),
        hinweis: finde("suchbaum-hinweis"),
        sprache: finde("suchbaum-sprache"),
        kopieren: finde("suchbaum-kopieren"),
        info: finde("suchbaum-info"),
        erklaerung: finde("suchbaum-erklaerung"),
        start: finde("suchbaum-start"),
        vor: finde("suchbaum-vor"),
        zurueck: finde("suchbaum-zurueck"),
        zuruecksetzen: finde("suchbaum-zuruecksetzen"),
        tempo: finde("suchbaum-tempo"),
        vergleiche: finde("suchbaum-vergleiche"),
        schritte: finde("suchbaum-schritte")
      };

      this.ansicht = new strukturen.Baumansicht(finde("suchbaum-leinwand"));
      this.code = new TRACE.Codeansicht(finde("suchbaum-code"));
      TRACE.verbindeKopierKnopf(this.el.kopieren, () => this.code.holeText());
      this.schreibtisch = new TRACE.Schreibtisch(finde("suchbaum-schreibtisch"));
      this.player = new TRACE.Player({
        beiSchritt: (schritt, index, vorheriger) => this._zeigeSchritt(schritt, index, vorheriger),
        beiStatus: (status) => this._zeigeStatus(status)
      });
      this.player.setzeTempo(Number(this.el.tempo.value));

      this.sprache = "pseudocode";
      this._letzteZeile = null;
      this.code.setzeCode(strukturen.suchbaum.code[this.sprache]);
      this._zeigeInfo();

      this.el.werte.value = "50, 30, 70, 20, 40, 60, 80, 10";
      this.el.ziel.value = "60";

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

    _verbindeBedienung() {
      const el = this.el;
      el.start.addEventListener("click", () => this.player.umschalten());
      el.vor.addEventListener("click", () => this.player.vor());
      el.zurueck.addEventListener("click", () => this.player.zurueck());
      el.zuruecksetzen.addEventListener("click", () => this.player.zumAnfang());
      el.tempo.addEventListener("input", () => this.player.setzeTempo(Number(el.tempo.value)));
      el.anwenden.addEventListener("click", () => this._wendeEingabeAn());
      el.zufall.addEventListener("click", () => {
        const { werte, ziel } = zufallsWerte();
        el.werte.value = werte.join(", ");
        el.ziel.value = ziel;
        this._wendeEingabeAn();
      });
      for (const feld of [el.werte, el.ziel]) {
        feld.addEventListener("keydown", (ereignis) => {
          if (ereignis.key === "Enter") {
            ereignis.preventDefault();
            this._wendeEingabeAn();
          }
        });
      }

      for (const knopf of el.sprache.children) {
        knopf.addEventListener("click", () => {
          if (knopf.dataset.sprache === this.sprache) return;
          this.sprache = knopf.dataset.sprache;
          for (const k of el.sprache.children) k.setAttribute("aria-pressed", String(k === knopf));
          this.code.setzeCode(strukturen.suchbaum.code[this.sprache]);
          this.code.markiere(this._letzteZeile);
        });
      }
    }

    _leseZahlenliste(text) {
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

    _wendeEingabeAn() {
      const { zahlen: werte, ungueltig: ungueltigWerte } = this._leseZahlenliste(this.el.werte.value);
      const zielText = this.el.ziel.value.trim();
      let ziel = null;
      let zielUngueltig = false;
      if (zielText !== "") {
        const zahl = Number(zielText);
        if (Number.isInteger(zahl) && zahl >= 1 && zahl <= 999) ziel = zahl;
        else zielUngueltig = true;
      }

      const hinweise = [];
      if (ungueltigWerte.length) hinweise.push(`Ignoriert (keine ganze Zahl 1–999): ${ungueltigWerte.join(", ")}.`);
      if (zielUngueltig) hinweise.push(`„${zielText}“ ist keine gültige Zahl zum Suchen – Suche wird übersprungen.`);
      this.el.hinweis.textContent = hinweise.join(" ");

      this.schreibtisch.neuBeginnen();
      this.player.laden(protokolliere(werte, ziel));
    }

    _zeigeInfo() {
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

  strukturen.SuchbaumBereich = SuchbaumBereich;
})(window.TRACE, window.TRACE.strukturen);
