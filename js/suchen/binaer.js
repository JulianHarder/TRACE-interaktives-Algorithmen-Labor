/**
 * Binäre Suche
 * ------------
 * Prüft immer die Mitte des aktuellen Suchbereichs. Ist der Wert dort zu
 * klein, kann die gesuchte Zahl nur noch rechts stehen; ist er zu groß, nur
 * noch links. So halbiert sich der Suchbereich bei jedem Schritt.
 *
 * Wichtig: Das funktioniert nur, wenn die Werte aufsteigend sortiert sind –
 * sonst sagt "zu klein" bzw. "zu groß" nichts darüber aus, auf welcher Seite
 * die gesuchte Zahl steht. TRACE sortiert die Werte deshalb automatisch,
 * sobald die binäre Suche ausgewählt wird (siehe suchen/bereich.js).
 */
(function (suchen) {
  "use strict";

  const { registriere } = suchen;

  registriere({
    id: "binaer",
    name: "Binäre Suche",

    info: {
      beschreibung: "Prüft immer die Mitte des Suchbereichs und halbiert ihn dadurch bei jedem Schritt – auf der falschen Seite muss die Zahl gar nicht erst gesucht werden.",
      schnitt: "O(log n)",
      schlimmster: "O(log n)",
      bester: "O(1)",
      speicher: "O(1)",
      brauchtSortierung: true,
      einsatz: "Sehr schnell bei großen Mengen sortierter Werte – bei 1 Million Zahlen reichen höchstens etwa 20 Vergleiche. Funktioniert aber nur bei sortierten Werten, deshalb sortiert TRACE die Zahlen dafür automatisch."
    },

    code: {
      pseudocode: `
        PROZEDUR BinaereSuche(a, ziel)
          von ← 0
          bis ← Länge(a) − 1
          SOLANGE von ≤ bis                           @@schleife
            mitte ← (von + bis) DIV 2                  @@mitte
            WENN a[mitte] = ziel DANN                  @@vergleich
              RÜCKGABE mitte                             @@gefunden
            SONST WENN a[mitte] < ziel DANN             @@zuKlein
              von ← mitte + 1
            SONST                                        @@zuGross
              bis ← mitte − 1
            ENDE WENN
          ENDE SOLANGE
          RÜCKGABE „nicht gefunden“                     @@ende
        ENDE PROZEDUR
      `,
      csharp: `
        int BinaereSuche(int[] a, int ziel)
        {
            int von = 0;
            int bis = a.Length - 1;

            while (von <= bis)                           @@schleife
            {
                int mitte = (von + bis) / 2;               @@mitte

                if (a[mitte] == ziel)                       @@vergleich
                {
                    return mitte;                             @@gefunden
                }
                else if (a[mitte] < ziel)                    @@zuKlein
                {
                    von = mitte + 1;
                }
                else                                          @@zuGross
                {
                    bis = mitte - 1;
                }
            }
            return -1; // nicht gefunden                     @@ende
        }
      `,
      javascript: `
        function binaereSuche(a, ziel) {
          let von = 0;
          let bis = a.length - 1;

          while (von <= bis) {                           @@schleife
            const mitte = Math.floor((von + bis) / 2);     @@mitte

            if (a[mitte] === ziel) {                       @@vergleich
              return mitte;                                  @@gefunden
            } else if (a[mitte] < ziel) {                  @@zuKlein
              von = mitte + 1;
            } else {                                        @@zuGross
              bis = mitte - 1;
            }
          }
          return -1; // nicht gefunden                     @@ende
        }
      `
    },

    suche: function* (a, ziel) {
      let von = 0;
      let bis = a.length - 1;

      while (von <= bis) {
        const mitte = Math.floor((von + bis) / 2);
        const bereich = { von, bis, text: "aktueller Suchbereich" };

        yield {
          typ: "vergleich",
          indizes: [mitte],
          zeiger: { von, bis, mitte },
          bereich,
          zeile: "vergleich",
          variablen: { von, bis, mitte, ziel },
          text: a[mitte] === ziel
            ? `${a[mitte]} in der Mitte (Position ${mitte}) ist die gesuchte Zahl!`
            : `${a[mitte]} in der Mitte (Position ${mitte}) ist nicht ${ziel}.`
        };

        if (a[mitte] === ziel) {
          yield {
            typ: "gefunden",
            indizes: [mitte],
            zeiger: { mitte },
            zeile: "gefunden",
            variablen: { von, bis, mitte, ziel },
            text: `Gefunden: ${ziel} steht an Position ${mitte}.`
          };
          return;
        }

        if (a[mitte] < ziel) {
          von = mitte + 1;
          yield {
            typ: "markieren",
            zeiger: { von, bis },
            bereich: von <= bis ? { von, bis, text: "neuer Suchbereich" } : null,
            zeile: "zuKlein",
            variablen: { von, bis, mitte, ziel },
            text: `${a[mitte]} ist kleiner als ${ziel} – die gesuchte Zahl kann nur noch rechts von der Mitte stehen.` +
              (von <= bis ? ` Neuer Suchbereich: ${von}–${bis}.` : " Der Suchbereich ist jetzt leer.")
          };
        } else {
          bis = mitte - 1;
          yield {
            typ: "markieren",
            zeiger: { von, bis },
            bereich: von <= bis ? { von, bis, text: "neuer Suchbereich" } : null,
            zeile: "zuGross",
            variablen: { von, bis, mitte, ziel },
            text: `${a[mitte]} ist größer als ${ziel} – die gesuchte Zahl kann nur noch links von der Mitte stehen.` +
              (von <= bis ? ` Neuer Suchbereich: ${von}–${bis}.` : " Der Suchbereich ist jetzt leer.")
          };
        }
      }
    }
  });
})(window.TRACE.suchen);
