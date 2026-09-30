/**
 * Bubble Sort
 * -----------
 * Vergleicht immer zwei Nachbarn und tauscht sie, wenn sie falsch herum stehen.
 * Nach jedem Durchlauf ist die größte Zahl des unsortierten Teils ganz hinten.
 * Wird in einem Durchlauf nichts getauscht, ist alles sortiert (früher Abbruch).
 */
(function (sortieren) {
  "use strict";

  const { registriere, tausche, indexbereich } = sortieren;

  registriere({
    id: "bubble",
    name: "Bubble Sort",

    info: {
      beschreibung: "Vergleicht immer zwei Nachbarn und tauscht sie, wenn sie falsch herum stehen. So steigt die größte Zahl wie eine Blase nach hinten auf.",
      schnitt: "O(n²)",
      schlimmster: "O(n²)",
      bester: "O(n)",
      speicher: "O(1)",
      stabil: true,
      einsatz: "In der Praxis kaum, weil zu langsam. Ideal zum Lernen, weil das Prinzip sehr einfach ist."
    },

    code: {
      pseudocode: `
        PROZEDUR BubbleSort(a)
          n ← Länge(a)
          FÜR i ← 0 BIS n − 2                        @@durchlauf
            getauscht ← FALSCH
            FÜR j ← 0 BIS n − 2 − i
              WENN a[j] > a[j + 1] DANN              @@vergleich
                tausche a[j] und a[j + 1]            @@tausch
                getauscht ← WAHR
              ENDE WENN
            ENDE FÜR                                 @@platz
            WENN getauscht = FALSCH DANN             @@frueh
              ABBRUCH  // alles sortiert
            ENDE WENN
          ENDE FÜR
        ENDE PROZEDUR                                @@ende
      `,
      csharp: `
        void BubbleSort(int[] a)
        {
            int n = a.Length;
            for (int i = 0; i < n - 1; i++)            @@durchlauf
            {
                bool getauscht = false;
                for (int j = 0; j < n - 1 - i; j++)
                {
                    if (a[j] > a[j + 1])                 @@vergleich
                    {
                        (a[j], a[j + 1]) = (a[j + 1], a[j]); @@tausch
                        getauscht = true;
                    }
                }                                          @@platz
                if (!getauscht) break;                      @@frueh
            }
        }                                                    @@ende
      `,
      javascript: `
        function bubbleSort(a) {
          const n = a.length;
          for (let i = 0; i < n - 1; i++) {              @@durchlauf
            let getauscht = false;
            for (let j = 0; j < n - 1 - i; j++) {
              if (a[j] > a[j + 1]) {                       @@vergleich
                [a[j], a[j + 1]] = [a[j + 1], a[j]];         @@tausch
                getauscht = true;
              }
            }                                               @@platz
            if (!getauscht) break;                           @@frueh
          }
        }                                                     @@ende
      `
    },

    sortiere: function* (a) {
      const n = a.length;

      for (let i = 0; i < n - 1; i++) {
        const letzter = n - 1 - i;
        const bereich = { von: 0, bis: letzter, text: "unsortierter Teil" };
        let getauscht = false;

        yield {
          typ: "markieren",
          zeile: "durchlauf",
          bereich,
          variablen: { n, i, j: undefined, getauscht },
          text: `Durchlauf ${i + 1}: Gehe von links nach rechts durch den unsortierten Teil. Die größte Zahl wandert dabei nach hinten.`
        };

        for (let j = 0; j < letzter; j++) {
          const links = a[j];
          const rechts = a[j + 1];
          const falschHerum = links > rechts;

          yield {
            typ: "vergleich",
            indizes: [j, j + 1],
            zeiger: { j },
            zeile: "vergleich",
            bereich,
            variablen: { n, i, j, getauscht },
            text: falschHerum
              ? `${links} ist größer als ${rechts}, also werden sie getauscht.`
              : `${links} ist nicht größer als ${rechts}, also bleiben sie stehen.`
          };

          if (falschHerum) {
            tausche(a, j, j + 1);
            getauscht = true;
            yield {
              typ: "tausch",
              indizes: [j, j + 1],
              zeiger: { j },
              zeile: "tausch",
              bereich,
              variablen: { n, i, j, getauscht },
              text: `${links} und ${rechts} haben die Plätze getauscht.`
            };
          }
        }

        yield {
          typ: "platziert",
          indizes: [letzter],
          platziert: [letzter],
          zeile: "platz",
          variablen: { n, i, j: undefined, getauscht },
          text: `Durchlauf ${i + 1} ist fertig: ${a[letzter]} steht jetzt an seinem endgültigen Platz.`
        };

        if (!getauscht) {
          yield {
            typ: "platziert",
            platziert: indexbereich(0, letzter - 1),
            zeile: "frueh",
            variablen: { n, i, j: undefined, getauscht },
            text: "In diesem Durchlauf wurde nichts getauscht. Also ist alles sortiert und Bubble Sort darf früh aufhören."
          };
          return;
        }
      }
    }
  });
})(window.TRACE.sortieren);
