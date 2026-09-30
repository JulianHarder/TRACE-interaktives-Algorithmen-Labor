/**
 * Dijkstra
 * --------
 * Statt einer einfachen Warteschlange nutzt Dijkstra eine Prioritätswarte-
 * schlange: Es wird immer das Feld mit der bisher kürzesten bekannten
 * Entfernung zum Start zuerst bearbeitet. Auf einem Gitter, auf dem jeder
 * Schritt gleich viel kostet, sieht das Ergebnis wie bei der Breitensuche
 * aus – der Unterschied zeigt sich erst, wenn Felder unterschiedlich viel
 * kosten dürfen (z. B. Sumpf teurer als Straße). Genau das kann Dijkstra,
 * die Breitensuche nicht.
 *
 * Ein Feld kann mehrfach mit einer immer kürzeren Entfernung in die
 * Warteschlange gelegt werden. Wird es dann entnommen, obwohl es bereits
 * abschließend bearbeitet wurde, wird dieser veraltete Eintrag einfach
 * übersprungen ("verworfen" in der Erklärung).
 */
(function (wegfindung) {
  "use strict";

  const { registriere, schluessel, nachbarn, kosten, wegRekonstruieren, Prioritaetswarteschlange } = wegfindung;

  registriere({
    id: "dijkstra",
    name: "Dijkstra",

    info: {
      beschreibung: "Bearbeitet immer das Feld mit der bisher kürzesten bekannten Entfernung zuerst – mit einer Prioritätswarteschlange statt einer einfachen Warteschlange.",
      laufzeit: "O(Felder · log Felder)",
      speicher: "O(Felder)",
      kuerzesterWeg: true,
      einsatz: "Findet den kürzesten Weg auch dann, wenn Felder unterschiedlich viel kosten (z. B. Sumpf teurer als Straße) – solange keine Kosten negativ sind. Male mit dem Werkzeug „Sumpf“ ein paar teure Felder ein, um den Unterschied zur Breitensuche zu sehen: Ohne Sumpf liefern beide denselben Weg."
    },

    code: {
      pseudocode: `
        PROZEDUR Dijkstra(gitter, start, ziel)
          distanz[start] ← 0
          warteschlange ← Prioritätswarteschlange mit (start, 0)
          abgeschlossen ← {}
          SOLANGE warteschlange nicht leer
            aktuell ← warteschlange.entnehmeMinimum()          @@entnehmen
            WENN aktuell ∈ abgeschlossen DANN WEITER            @@verworfen
            abgeschlossen.hinzufügen(aktuell)
            WENN aktuell = ziel DANN                             @@gefunden
              RÜCKGABE Weg(aktuell)                                 @@rueckgabe
            ENDE WENN
            FÜR JEDEN nachbar VON aktuell
              neu ← distanz[aktuell] + Kosten(nachbar)             // Sumpf kostet mehr als normaler Boden
              WENN nachbar ∉ distanz ODER neu < distanz[nachbar] DANN  @@entdecken
                distanz[nachbar] ← neu
                warteschlange.einfügen(nachbar, neu)
              ENDE WENN
            ENDE FÜR
          ENDE SOLANGE
          RÜCKGABE „kein Weg gefunden“                            @@ende
        ENDE PROZEDUR
      `,
      csharp: `
        List<Feld> Dijkstra(Gitter gitter, Feld start, Feld ziel)
        {
            var distanz = new Dictionary<Feld, int> { [start] = 0 };
            var warteschlange = new Prioritaetswarteschlange<Feld>();
            warteschlange.Einfuegen(start, 0);
            var abgeschlossen = new HashSet<Feld>();
            var vorgaenger = new Dictionary<Feld, Feld>();

            while (!warteschlange.Leer)
            {
                Feld aktuell = warteschlange.EntnehmeMinimum();      @@entnehmen

                if (abgeschlossen.Contains(aktuell)) continue;         @@verworfen
                abgeschlossen.Add(aktuell);

                if (aktuell.Equals(ziel))                               @@gefunden
                {
                    return Weg(vorgaenger, ziel);                          @@rueckgabe
                }

                foreach (Feld nachbar in gitter.Nachbarn(aktuell))
                {
                    int neu = distanz[aktuell] + Kosten(nachbar); // Sumpf kostet mehr als normaler Boden
                    if (!distanz.ContainsKey(nachbar) || neu < distanz[nachbar])  @@entdecken
                    {
                        distanz[nachbar] = neu;
                        vorgaenger[nachbar] = aktuell;
                        warteschlange.Einfuegen(nachbar, neu);
                    }
                }
            }
            return null; // kein Weg gefunden                            @@ende
        }
      `,
      javascript: `
        function dijkstra(gitter, start, ziel) {
          const distanz = new Map([[schluessel(start), 0]]);
          const warteschlange = new Prioritaetswarteschlange();
          warteschlange.einfuegen(start, 0);
          const abgeschlossen = new Set();
          const vorgaenger = new Map();

          while (!warteschlange.leer) {
            const aktuell = warteschlange.entnehmeMinimum();        @@entnehmen

            if (abgeschlossen.has(schluessel(aktuell))) continue;      @@verworfen
            abgeschlossen.add(schluessel(aktuell));

            if (gleich(aktuell, ziel)) {                                @@gefunden
              return weg(vorgaenger, ziel);                                @@rueckgabe
            }

            for (const nachbar of nachbarn(gitter, aktuell)) {
              const neu = distanz.get(schluessel(aktuell)) + kosten(nachbar); // Sumpf kostet mehr als normaler Boden
              if (!distanz.has(schluessel(nachbar)) || neu < distanz.get(schluessel(nachbar))) {  @@entdecken
                distanz.set(schluessel(nachbar), neu);
                vorgaenger.set(schluessel(nachbar), aktuell);
                warteschlange.einfuegen(nachbar, neu);
              }
            }
          }
          return null; // kein Weg gefunden                             @@ende
        }
      `
    },

    suche: function* (kontext, start, ziel) {
      const distanz = new Map([[schluessel(start), 0]]);
      const abgeschlossen = new Set();
      const vorgaenger = new Map();
      const warteschlange = new Prioritaetswarteschlange();
      warteschlange.einfuegen(start, 0);

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
          variablen: { zeile: aktuell.zeile, spalte: aktuell.spalte, distanz: distanz.get(s) },
          text: `Feld (${aktuell.zeile}, ${aktuell.spalte}) hat die kleinste bekannte Entfernung (${distanz.get(s)}) – jetzt bearbeiten.`
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
            warteschlange.einfuegen(nachbar, neu);
            yield {
              typ: "entdecken",
              zelle: nachbar,
              zeile: "entdecken",
              variablen: { zeile: nachbar.zeile, spalte: nachbar.spalte, distanz: neu },
              text: `Feld (${nachbar.zeile}, ${nachbar.spalte}) ist über hier mit Gesamtkosten ${neu} erreichbar – in die Prioritätswarteschlange legen.`
            };
          }
        }
      }
    }
  });
})(window.TRACE.wegfindung);
