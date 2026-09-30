/**
 * A*
 * ---
 * Wie Dijkstra, nur dass die Prioritätswarteschlange nicht nur nach der
 * bisherigen Entfernung sortiert, sondern nach Entfernung PLUS einer
 * Schätzung, wie weit es von dort noch zum Ziel ist (hier: die Gitter-
 * Entfernung ohne Rücksicht auf Wände – die "Luftlinie" auf dem Gitter).
 * Dadurch werden Felder in Richtung Ziel bevorzugt, und A* muss meist
 * deutlich weniger Felder besuchen als Dijkstra oder die Breitensuche, um
 * denselben kürzesten Weg zu finden.
 */
(function (wegfindung) {
  "use strict";

  const { registriere, schluessel, nachbarn, kosten, wegRekonstruieren, heuristik, Prioritaetswarteschlange } = wegfindung;

  registriere({
    id: "astar",
    name: "A*",

    info: {
      beschreibung: "Wie Dijkstra, schätzt aber zusätzlich die Entfernung zum Ziel ab und bevorzugt Felder, die in diese Richtung liegen.",
      laufzeit: "O(Felder · log Felder)",
      speicher: "O(Felder)",
      kuerzesterWeg: true,
      einsatz: "Meist deutlich schneller als Dijkstra, weil die Schätzung unnötige Umwege vermeidet – gut zu erkennen an der Zahl der besuchten Felder. Die Schätzung darf dafür nie zu hoch sein, sonst kann der gefundene Weg zu lang ausfallen."
    },

    code: {
      pseudocode: `
        FUNKTION schaetzung(a, b)
          RÜCKGABE |a.zeile − b.zeile| + |a.spalte − b.spalte|     // Gitter-Entfernung ohne Wände
        ENDE FUNKTION

        PROZEDUR AStern(gitter, start, ziel)
          distanz[start] ← 0
          warteschlange ← Prioritätswarteschlange mit (start, schaetzung(start, ziel))
          abgeschlossen ← {}
          SOLANGE warteschlange nicht leer
            aktuell ← warteschlange.entnehmeMinimum()               @@entnehmen
            WENN aktuell ∈ abgeschlossen DANN WEITER                 @@verworfen
            abgeschlossen.hinzufügen(aktuell)
            WENN aktuell = ziel DANN                                  @@gefunden
              RÜCKGABE Weg(aktuell)                                      @@rueckgabe
            ENDE WENN
            FÜR JEDEN nachbar VON aktuell
              neu ← distanz[aktuell] + Kosten(nachbar)             // Sumpf kostet mehr als normaler Boden
              WENN nachbar ∉ distanz ODER neu < distanz[nachbar] DANN   @@entdecken
                distanz[nachbar] ← neu
                prioritaet ← neu + schaetzung(nachbar, ziel)
                warteschlange.einfügen(nachbar, prioritaet)
              ENDE WENN
            ENDE FÜR
          ENDE SOLANGE
          RÜCKGABE „kein Weg gefunden“                                 @@ende
        ENDE PROZEDUR
      `,
      csharp: `
        int Schaetzung(Feld a, Feld b)
        {
            return Math.Abs(a.Zeile - b.Zeile) + Math.Abs(a.Spalte - b.Spalte);
        }

        List<Feld> AStern(Gitter gitter, Feld start, Feld ziel)
        {
            var distanz = new Dictionary<Feld, int> { [start] = 0 };
            var warteschlange = new Prioritaetswarteschlange<Feld>();
            warteschlange.Einfuegen(start, Schaetzung(start, ziel));
            var abgeschlossen = new HashSet<Feld>();
            var vorgaenger = new Dictionary<Feld, Feld>();

            while (!warteschlange.Leer)
            {
                Feld aktuell = warteschlange.EntnehmeMinimum();          @@entnehmen

                if (abgeschlossen.Contains(aktuell)) continue;             @@verworfen
                abgeschlossen.Add(aktuell);

                if (aktuell.Equals(ziel))                                   @@gefunden
                {
                    return Weg(vorgaenger, ziel);                              @@rueckgabe
                }

                foreach (Feld nachbar in gitter.Nachbarn(aktuell))
                {
                    int neu = distanz[aktuell] + Kosten(nachbar); // Sumpf kostet mehr als normaler Boden
                    if (!distanz.ContainsKey(nachbar) || neu < distanz[nachbar])  @@entdecken
                    {
                        distanz[nachbar] = neu;
                        vorgaenger[nachbar] = aktuell;
                        int prioritaet = neu + Schaetzung(nachbar, ziel);
                        warteschlange.Einfuegen(nachbar, prioritaet);
                    }
                }
            }
            return null; // kein Weg gefunden                                @@ende
        }
      `,
      javascript: `
        function schaetzung(a, b) {
          return Math.abs(a.zeile - b.zeile) + Math.abs(a.spalte - b.spalte);
        }

        function aStern(gitter, start, ziel) {
          const distanz = new Map([[schluessel(start), 0]]);
          const warteschlange = new Prioritaetswarteschlange();
          warteschlange.einfuegen(start, schaetzung(start, ziel));
          const abgeschlossen = new Set();
          const vorgaenger = new Map();

          while (!warteschlange.leer) {
            const aktuell = warteschlange.entnehmeMinimum();           @@entnehmen

            if (abgeschlossen.has(schluessel(aktuell))) continue;         @@verworfen
            abgeschlossen.add(schluessel(aktuell));

            if (gleich(aktuell, ziel)) {                                  @@gefunden
              return weg(vorgaenger, ziel);                                  @@rueckgabe
            }

            for (const nachbar of nachbarn(gitter, aktuell)) {
              const neu = distanz.get(schluessel(aktuell)) + kosten(nachbar); // Sumpf kostet mehr als normaler Boden
              if (!distanz.has(schluessel(nachbar)) || neu < distanz.get(schluessel(nachbar))) {  @@entdecken
                distanz.set(schluessel(nachbar), neu);
                vorgaenger.set(schluessel(nachbar), aktuell);
                const prioritaet = neu + schaetzung(nachbar, ziel);
                warteschlange.einfuegen(nachbar, prioritaet);
              }
            }
          }
          return null; // kein Weg gefunden                               @@ende
        }
      `
    },

    suche: function* (kontext, start, ziel) {
      const distanz = new Map([[schluessel(start), 0]]);
      const abgeschlossen = new Set();
      const vorgaenger = new Map();
      const warteschlange = new Prioritaetswarteschlange();
      warteschlange.einfuegen(start, heuristik(start, ziel));

      while (!warteschlange.leer) {
        const aktuell = warteschlange.entnehmeMinimum();
        const s = schluessel(aktuell);

        if (abgeschlossen.has(s)) {
          yield {
            typ: "markieren",
            zeile: "verworfen",
            variablen: { zeile: aktuell.zeile, spalte: aktuell.spalte },
            text: `Feld (${aktuell.zeile}, ${aktuell.spalte}) wurde schon abschließend bearbeitet – dieser veraltete Eintrag wird verworfen.`
          };
          continue;
        }
        abgeschlossen.add(s);

        yield {
          typ: "besuchen",
          zelle: aktuell,
          zeile: "entnehmen",
          variablen: { zeile: aktuell.zeile, spalte: aktuell.spalte, distanz: distanz.get(s), schaetzung: heuristik(aktuell, ziel) },
          text: `Feld (${aktuell.zeile}, ${aktuell.spalte}) hat die kleinste Summe aus Entfernung und Schätzung – jetzt bearbeiten.`
        };

        if (aktuell.zeile === ziel.zeile && aktuell.spalte === ziel.spalte) {
          yield {
            typ: "weg",
            zellen: wegRekonstruieren(vorgaenger, ziel),
            zeile: "gefunden",
            variablen: { zeile: aktuell.zeile, spalte: aktuell.spalte },
            text: "Ziel erreicht – Weg zurückverfolgen."
          };
          return;
        }

        for (const nachbar of nachbarn(kontext, aktuell)) {
          const sN = schluessel(nachbar);
          const neu = distanz.get(s) + kosten(kontext, nachbar);
          if (!distanz.has(sN) || neu < distanz.get(sN)) {
            distanz.set(sN, neu);
            vorgaenger.set(sN, aktuell);
            const prioritaet = neu + heuristik(nachbar, ziel);
            warteschlange.einfuegen(nachbar, prioritaet);
            yield {
              typ: "entdecken",
              zelle: nachbar,
              zeile: "entdecken",
              variablen: { zeile: nachbar.zeile, spalte: nachbar.spalte, distanz: neu, schaetzung: heuristik(nachbar, ziel) },
              text: `Feld (${nachbar.zeile}, ${nachbar.spalte}) ist mit Gesamtkosten ${neu} erreichbar, geschätzt noch ${heuristik(nachbar, ziel)} bis zum Ziel.`
            };
          }
        }
      }
    }
  });
})(window.TRACE.wegfindung);
