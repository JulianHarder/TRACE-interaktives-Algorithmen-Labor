/**
 * Tiefensuche (DFS)
 * -----------------
 * Genau wie die Breitensuche – nur mit einem Stapel (LIFO: zuletzt rein,
 * zuerst raus) statt einer Warteschlange. Dadurch folgt DFS einer Richtung
 * so weit wie möglich und geht erst zurück, wenn es nicht mehr weitergeht.
 * Sie findet irgendeinen Weg zum Ziel, aber keinen garantiert kurzen.
 */
(function (wegfindung) {
  "use strict";

  const { registriere, schluessel, nachbarn, wegRekonstruieren } = wegfindung;

  registriere({
    id: "dfs",
    name: "Tiefensuche (DFS)",

    info: {
      beschreibung: "Folgt einer Richtung so weit wie möglich und geht erst zurück, wenn es nicht mehr weitergeht – wie beim Erkunden eines Labyrinths mit der Hand an der Wand.",
      laufzeit: "O(Felder)",
      speicher: "O(Felder)",
      kuerzesterWeg: false,
      einsatz: "Findet irgendeinen Weg, meist keinen kurzen. Nützlich, um schnell zu prüfen, ob überhaupt ein Weg existiert, nicht um den besten zu finden."
    },

    code: {
      pseudocode: `
        PROZEDUR DFS(gitter, start, ziel)
          stapel ← [start]
          besucht ← {start}
          SOLANGE stapel nicht leer
            aktuell ← stapel.obenEntnehmen()                @@entnehmen
            WENN aktuell = ziel DANN                          @@gefunden
              RÜCKGABE Weg(aktuell)                              @@rueckgabe
            ENDE WENN
            FÜR JEDEN nachbar VON aktuell
              WENN nachbar begehbar UND nachbar ∉ besucht DANN
                besucht.hinzufügen(nachbar)                    @@entdecken
                stapel.obenEinfügen(nachbar)
              ENDE WENN
            ENDE FÜR
          ENDE SOLANGE
          RÜCKGABE „kein Weg gefunden“                         @@ende
        ENDE PROZEDUR
      `,
      csharp: `
        List<Feld> DFS(Gitter gitter, Feld start, Feld ziel)
        {
            var stapel = new Stack<Feld>();
            stapel.Push(start);
            var besucht = new HashSet<Feld> { start };
            var vorgaenger = new Dictionary<Feld, Feld>();

            while (stapel.Count > 0)
            {
                Feld aktuell = stapel.Pop();                      @@entnehmen

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
                        stapel.Push(nachbar);
                    }
                }
            }
            return null; // kein Weg gefunden                       @@ende
        }
      `,
      javascript: `
        function dfs(gitter, start, ziel) {
          const stapel = [start];
          const besucht = new Set([schluessel(start)]);
          const vorgaenger = new Map();

          while (stapel.length > 0) {
            const aktuell = stapel.pop();                     @@entnehmen

            if (gleich(aktuell, ziel)) {                        @@gefunden
              return weg(vorgaenger, ziel);                        @@rueckgabe
            }

            for (const nachbar of nachbarn(gitter, aktuell)) {
              if (!besucht.has(schluessel(nachbar))) {
                besucht.add(schluessel(nachbar));                 @@entdecken
                vorgaenger.set(schluessel(nachbar), aktuell);
                stapel.push(nachbar);
              }
            }
          }
          return null; // kein Weg gefunden                      @@ende
        }
      `
    },

    suche: function* (kontext, start, ziel) {
      const stapel = [start];
      const besucht = new Set([schluessel(start)]);
      const vorgaenger = new Map();

      while (stapel.length > 0) {
        const aktuell = stapel.pop();

        yield {
          typ: "besuchen",
          zelle: aktuell,
          zeile: "entnehmen",
          variablen: { zeile: aktuell.zeile, spalte: aktuell.spalte, stapel: stapel.length },
          text: `Feld (${aktuell.zeile}, ${aktuell.spalte}) oben vom Stapel nehmen und untersuchen.`
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
          stapel.push(nachbar);
          yield {
            typ: "entdecken",
            zelle: nachbar,
            zeile: "entdecken",
            variablen: { zeile: nachbar.zeile, spalte: nachbar.spalte, stapel: stapel.length },
            text: `Feld (${nachbar.zeile}, ${nachbar.spalte}) ist neu und begehbar – oben auf den Stapel legen.`
          };
        }
      }
    }
  });
})(window.TRACE.wegfindung);
