/**
 * Breitensuche (BFS)
 * ------------------
 * Breitet sich ringförmig um den Start aus: zuerst werden alle Felder mit
 * 1 Schritt Abstand untersucht, dann alle mit 2, dann alle mit 3, und so
 * weiter. Das gelingt mit einer einfachen Warteschlange (FIFO – zuerst rein,
 * zuerst raus). Weil sich der Ring gleichmäßig ausbreitet, ist der erste
 * gefundene Weg zum Ziel garantiert der kürzeste – auf einem Gitter, auf dem
 * jeder Schritt gleich viel "kostet".
 */
(function (wegfindung) {
  "use strict";

  const { registriere, schluessel, nachbarn, wegRekonstruieren } = wegfindung;

  registriere({
    id: "bfs",
    name: "Breitensuche (BFS)",

    info: {
      beschreibung: "Breitet sich ringförmig um den Start aus – zuerst alle Felder mit 1 Schritt Abstand, dann 2, dann 3, und so weiter.",
      laufzeit: "O(Felder)",
      speicher: "O(Felder)",
      kuerzesterWeg: true,
      einsatz: "Findet auf einem Gitter, auf dem jeder Schritt gleich viel kostet, garantiert den kürzesten Weg. Die Grundlage, auf der Dijkstra und A* aufbauen."
    },

    code: {
      pseudocode: `
        PROZEDUR BFS(gitter, start, ziel)
          warteschlange ← [start]
          besucht ← {start}
          SOLANGE warteschlange nicht leer
            aktuell ← warteschlange.vorneEntnehmen()     @@entnehmen
            WENN aktuell = ziel DANN                      @@gefunden
              RÜCKGABE Weg(aktuell)                          @@rueckgabe
            ENDE WENN
            FÜR JEDEN nachbar VON aktuell
              WENN nachbar begehbar UND nachbar ∉ besucht DANN
                besucht.hinzufügen(nachbar)                @@entdecken
                warteschlange.hintenEinfügen(nachbar)
              ENDE WENN
            ENDE FÜR
          ENDE SOLANGE
          RÜCKGABE „kein Weg gefunden“                     @@ende
        ENDE PROZEDUR
      `,
      csharp: `
        List<Feld> BFS(Gitter gitter, Feld start, Feld ziel)
        {
            var warteschlange = new Queue<Feld>();
            warteschlange.Enqueue(start);
            var besucht = new HashSet<Feld> { start };
            var vorgaenger = new Dictionary<Feld, Feld>();

            while (warteschlange.Count > 0)
            {
                Feld aktuell = warteschlange.Dequeue();          @@entnehmen

                if (aktuell.Equals(ziel))                          @@gefunden
                {
                    return Weg(vorgaenger, ziel);                     @@rueckgabe
                }

                foreach (Feld nachbar in gitter.Nachbarn(aktuell))
                {
                    if (!besucht.Contains(nachbar))
                    {
                        besucht.Add(nachbar);                         @@entdecken
                        vorgaenger[nachbar] = aktuell;
                        warteschlange.Enqueue(nachbar);
                    }
                }
            }
            return null; // kein Weg gefunden                       @@ende
        }
      `,
      javascript: `
        function bfs(gitter, start, ziel) {
          const warteschlange = [start];
          const besucht = new Set([schluessel(start)]);
          const vorgaenger = new Map();

          while (warteschlange.length > 0) {
            const aktuell = warteschlange.shift();           @@entnehmen

            if (gleich(aktuell, ziel)) {                       @@gefunden
              return weg(vorgaenger, ziel);                       @@rueckgabe
            }

            for (const nachbar of nachbarn(gitter, aktuell)) {
              if (!besucht.has(schluessel(nachbar))) {
                besucht.add(schluessel(nachbar));                @@entdecken
                vorgaenger.set(schluessel(nachbar), aktuell);
                warteschlange.push(nachbar);
              }
            }
          }
          return null; // kein Weg gefunden                     @@ende
        }
      `
    },

    suche: function* (kontext, start, ziel) {
      const warteschlange = [start];
      const besucht = new Set([schluessel(start)]);
      const vorgaenger = new Map();

      while (warteschlange.length > 0) {
        const aktuell = warteschlange.shift();

        yield {
          typ: "besuchen",
          zelle: aktuell,
          zeile: "entnehmen",
          variablen: { zeile: aktuell.zeile, spalte: aktuell.spalte, warteschlange: warteschlange.length },
          text: `Feld (${aktuell.zeile}, ${aktuell.spalte}) aus der Warteschlange nehmen und untersuchen.`
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
          const s = schluessel(nachbar);
          if (besucht.has(s)) continue;
          besucht.add(s);
          vorgaenger.set(s, aktuell);
          warteschlange.push(nachbar);
          yield {
            typ: "entdecken",
            zelle: nachbar,
            zeile: "entdecken",
            variablen: { zeile: nachbar.zeile, spalte: nachbar.spalte, warteschlange: warteschlange.length },
            text: `Feld (${nachbar.zeile}, ${nachbar.spalte}) ist neu und begehbar – in die Warteschlange legen.`
          };
        }
      }
    }
  });
})(window.TRACE.wegfindung);
