/**
 * Lineare Suche
 * -------------
 * Prüft die Werte der Reihe nach, von vorne bis hinten, bis der gesuchte Wert
 * gefunden ist oder alle geprüft wurden. Funktioniert bei jeder Reihenfolge –
 * die Werte müssen dafür nicht sortiert sein.
 */
(function (suchen) {
  "use strict";

  const { registriere } = suchen;

  registriere({
    id: "linear",
    name: "Lineare Suche",

    info: {
      beschreibung: "Prüft die Werte der Reihe nach, von vorne bis hinten, bis der gesuchte Wert gefunden ist oder alle geprüft wurden.",
      schnitt: "O(n)",
      schlimmster: "O(n)",
      bester: "O(1)",
      speicher: "O(1)",
      brauchtSortierung: false,
      einsatz: "Funktioniert bei jeder Reihenfolge, auch bei unsortierten Werten. Bei großen, sortierten Datenmengen ist die binäre Suche aber deutlich schneller."
    },

    code: {
      pseudocode: `
        PROZEDUR LineareSuche(a, ziel)
          FÜR i ← 0 BIS Länge(a) − 1
            WENN a[i] = ziel DANN                @@vergleich
              RÜCKGABE i                          @@gefunden
            ENDE WENN
          ENDE FÜR
          RÜCKGABE „nicht gefunden“                @@ende
        ENDE PROZEDUR
      `,
      csharp: `
        int LineareSuche(int[] a, int ziel)
        {
            for (int i = 0; i < a.Length; i++)
            {
                if (a[i] == ziel)                  @@vergleich
                {
                    return i;                        @@gefunden
                }
            }
            return -1; // nicht gefunden             @@ende
        }
      `,
      javascript: `
        function lineareSuche(a, ziel) {
          for (let i = 0; i < a.length; i++) {
            if (a[i] === ziel) {                    @@vergleich
              return i;                                @@gefunden
            }
          }
          return -1; // nicht gefunden                 @@ende
        }
      `
    },

    suche: function* (a, ziel) {
      const n = a.length;

      for (let i = 0; i < n; i++) {
        const bereich = { von: i, bis: n - 1, text: "noch ungeprüfter Bereich" };
        const treffer = a[i] === ziel;

        yield {
          typ: "vergleich",
          indizes: [i],
          zeiger: { i },
          bereich,
          zeile: "vergleich",
          variablen: { i, ziel },
          text: treffer
            ? `${a[i]} an Position ${i} ist die gesuchte Zahl!`
            : `${a[i]} an Position ${i} ist nicht ${ziel}, also weiter zum nächsten Kästchen.`
        };

        if (treffer) {
          yield {
            typ: "gefunden",
            indizes: [i],
            zeiger: { i },
            zeile: "gefunden",
            variablen: { i, ziel },
            text: `Gefunden: ${ziel} steht an Position ${i}.`
          };
          return;
        }
      }
    }
  });
})(window.TRACE.suchen);
